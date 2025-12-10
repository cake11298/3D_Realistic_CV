/**
 * Waterfall Particle Compute Shader (WGSL)
 * Lagrangian Fluid Simulation on GPU
 *
 * This shader runs entirely on the GPU, processing 50,000+ particles in parallel
 * Each workgroup handles 64 particles simultaneously
 */

struct Particle {
  position: vec3<f32>,
  velocity: vec3<f32>,
  life: f32,
  size: f32,
}

struct SimulationParams {
  deltaTime: f32,
  gravity: vec3<f32>,
  damping: f32,
  viscosity: f32,
  particleCount: u32,
  emitterPosition: vec3<f32>,
  emitterRadius: f32,
}

// Storage buffers (persistent in GPU VRAM)
@group(0) @binding(0) var<storage, read_write> particles: array<Particle>;
@group(0) @binding(1) var<uniform> params: SimulationParams;

// Obstacle data (rocks, terrain)
struct Obstacle {
  position: vec3<f32>,
  radius: f32,
}

@group(0) @binding(2) var<storage, read> obstacles: array<Obstacle>;

// Pseudo-random number generator (GPU-friendly)
fn hash(p: u32) -> f32 {
  var state = p;
  state = state * 747796405u + 2891336453u;
  state = ((state >> ((state >> 28u) + 4u)) ^ state) * 277803737u;
  state = (state >> 22u) ^ state;
  return f32(state) / 4294967295.0;
}

fn random3(seed: u32) -> vec3<f32> {
  return vec3<f32>(
    hash(seed),
    hash(seed + 1u),
    hash(seed + 2u)
  );
}

// Check collision with obstacles
fn checkObstacleCollision(pos: vec3<f32>, vel: vec3<f32>) -> vec3<f32> {
  var newVel = vel;

  for (var i = 0u; i < arrayLength(&obstacles); i++) {
    let obstacle = obstacles[i];
    let toObstacle = pos - obstacle.position;
    let dist = length(toObstacle);

    if (dist < obstacle.radius) {
      // Bounce off obstacle
      let normal = normalize(toObstacle);
      newVel = reflect(vel, normal) * 0.6; // Energy loss on collision
    }
  }

  return newVel;
}

// Apply simple fluid viscosity (neighboring particle interaction)
fn applyViscosity(index: u32, pos: vec3<f32>, vel: vec3<f32>) -> vec3<f32> {
  var avgVel = vel;
  var count = 1.0;
  let influenceRadius = 0.5;

  // Sample nearby particles (simplified for performance)
  let sampleStep = max(1u, params.particleCount / 1000u);

  for (var i = 0u; i < params.particleCount; i += sampleStep) {
    if (i == index) { continue; }

    let otherPos = particles[i].position;
    let dist = distance(pos, otherPos);

    if (dist < influenceRadius && dist > 0.001) {
      avgVel += particles[i].velocity;
      count += 1.0;
    }
  }

  return mix(vel, avgVel / count, params.viscosity);
}

// Main compute kernel
@compute @workgroup_size(64, 1, 1)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
  let index = global_id.x;

  // Bounds check
  if (index >= params.particleCount) {
    return;
  }

  var particle = particles[index];

  // Respawn dead particles at emitter
  if (particle.life <= 0.0) {
    let rand = random3(index + u32(params.deltaTime * 1000.0));
    let offset = (rand - 0.5) * params.emitterRadius;

    particle.position = params.emitterPosition + offset;
    particle.velocity = vec3<f32>(
      (rand.x - 0.5) * 2.0,
      -1.0 - rand.y * 2.0,
      (rand.z - 0.5) * 2.0
    );
    particle.life = 5.0 + rand.x * 3.0;
    particle.size = 0.05 + rand.y * 0.05;
  } else {
    // Physics integration
    var acceleration = params.gravity;

    // Apply viscosity (fluid interaction)
    particle.velocity = applyViscosity(index, particle.position, particle.velocity);

    // Check obstacle collisions
    particle.velocity = checkObstacleCollision(particle.position, particle.velocity);

    // Verlet integration
    particle.velocity += acceleration * params.deltaTime;
    particle.velocity *= params.damping;
    particle.position += particle.velocity * params.deltaTime;

    // Ground collision
    if (particle.position.y < -10.0) {
      particle.position.y = -10.0;
      particle.velocity.y *= -0.3; // Bounce
      particle.velocity.x *= 0.8; // Friction
      particle.velocity.z *= 0.8;
    }

    // Update life
    particle.life -= params.deltaTime;
  }

  // Write back to buffer
  particles[index] = particle;
}

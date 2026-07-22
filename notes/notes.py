import math

class Circle:
    def __init__(self, x, y, radius, vx, vy, mass=1, restitution=0.8):
        self.x = x
        self.y = y
        self.radius = radius
        self.vx = vx
        self.vy = vy
        self.mass = mass
        self.restitution = restitution

def collide_circles(c1, c2, dt):
    # Calculate relative position and velocity
    dx = c2.x - c1.x
    dy = c2.y - c1.y
    dvx = c2.vx - c1.vx
    dvy = c2.vy - c1.vy

    # Coefficients for quadratic equation to find TOI
    a = dvx**2 + dvy**2
    b = 2 * (dx * dvx + dy * dvy)
    c = dx**2 + dy**2 - (c1.radius + c2.radius)**2

    # Solve for TOI
    discriminant = b**2 - 4 * a * c
    if discriminant < 0 or a == 0:
        return None # No collision or no relative movement

    sqrt_discriminant = math.sqrt(discriminant)
    t1 = (-b - sqrt_discriminant) / (2 * a)
    t2 = (-b + sqrt_discriminant) / (2 * a)

    toi = None
    if 0 <= t1 < dt:
        toi = t1
    elif 0 <= t2 < dt:
        toi = t2

    if toi is None:
        return None # Collision not within this time step

    # Move objects to TOI
    c1.x += c1.vx * toi
    c1.y += c1.vy * toi
    c2.x += c2.vx * toi
    c2.y += c2.vy * toi

    # Collision normal
    nx = c2.x - c1.x
    ny = c2.y - c1.y
    length = math.sqrt(nx**2 + ny**2)
    if length == 0: return None # Objects perfectly overlapping, handle as needed
    nx /= length
    ny /= length

    # Relative velocity along normal
    v_rel_n = (c2.vx - c1.vx) * nx + (c2.vy - c1.vy) * ny

    if v_rel_n > 0: # Already moving apart
        return None

    # Impulse calculation
    e = min(c1.restitution, c2.restitution)
    j = -(1 + e) * v_rel_n / (1/c1.mass + 1/c2.mass)

    # Apply impulse
    c1.vx -= j / c1.mass * nx
    c1.vy -= j / c1.mass * ny
    c2.vx += j / c2.mass * nx
    c2.vy += j / c2.mass * ny

    # Move objects for remaining time
    remaining_dt = dt - toi
    c1.x += c1.vx * remaining_dt
    c1.y += c1.vy * remaining_dt
    c2.x += c2.vx * remaining_dt
    c2.y += c2.vy * remaining_dt

    return toi # Return time of impact if needed

# Example usage
# c1 = Circle(0, 0, 10, 5, 0)
# c2 = Circle(50, 0, 10, -5, 0)
# dt = 1.0 # Time step
# collide_circles(c1, c2, dt)
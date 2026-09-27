// r.dir is unit direction vector of ray
dirfrac.x = 1.0f / r.dir.x;
dirfrac.y = 1.0f / r.dir.y;
dirfrac.z = 1.0f / r.dir.z;
// lb is the corner of AABB with minimal coordinates - left bottom, rt is maximal corner
// r.org is origin of ray
float t1 = (lb.x - r.org.x)*dirfrac.x;
float t2 = (rt.x - r.org.x)*dirfrac.x;
float t3 = (lb.y - r.org.y)*dirfrac.y;
float t4 = (rt.y - r.org.y)*dirfrac.y;
float t5 = (lb.z - r.org.z)*dirfrac.z;
float t6 = (rt.z - r.org.z)*dirfrac.z;

float tmin = max(max(min(t1, t2), min(t3, t4)), min(t5, t6));
float tmax = min(min(max(t1, t2), max(t3, t4)), max(t5, t6));

// if tmax < 0, ray (line) is intersecting AABB, but the whole AABB is behind us
if (tmax < 0)
{
    t = tmax;
    return false;
}

// if tmin > tmax, ray doesn't intersect AABB
if (tmin > tmax)
{
    t = tmax;
    return false;
}

t = tmin;
return true;



/* ===================================================================== */



// Assuming 'object' and 'platform' are objects with position, velocity, and AABB properties

// Calculate the relative velocity between the object and the platform
Vector2 relativeVelocity = object.velocity - platform.velocity;

// Calculate the Time of Impact (TOI) using a Swept AABB algorithm
// This function would return a value between 0 and 1, representing the fraction of the frame's movement before collision
float collisionTime = SweptAABB(object.AABB, platform.AABB, relativeVelocity * deltaTime);

if (collisionTime < 1.0f) { // Collision occurred within the current frame
    // Move both objects to the point of impact
    object.position += object.velocity * collisionTime * deltaTime;
    platform.position += platform.velocity * collisionTime * deltaTime;

    // Calculate collision normal (e.g., if platform is horizontal, normal is (0, 1))
    Vector2 normal = GetCollisionNormal(object.AABB, platform.AABB); 

    // Reflect object's velocity
    float restitution = 0.8f; // Example restitution coefficient
    object.velocity = Reflect(object.velocity, normal) * restitution;

    // Add platform's velocity component to the object's velocity (e.g., for horizontal movement)
    object.velocity.x += platform.velocity.x; 

    // Continue moving for the remaining time in the frame
    float remainingTime = 1.0f - collisionTime;
    object.position += object.velocity * remainingTime * deltaTime;
    platform.position += platform.velocity * remainingTime * deltaTime;
} else { // No collision, move normally
    object.position += object.velocity * deltaTime;
    platform.position += platform.velocity * deltaTime;
}
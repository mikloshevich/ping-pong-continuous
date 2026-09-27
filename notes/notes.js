const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');

let x = 50;
let y = 50;
let dx = 2; // X-offset for motion blur

function drawMotionBlur() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear previous frame

    // Draw multiple slightly offset instances with decreasing alpha
    for (let i = 0; i < 10; i++) {
        ctx.globalAlpha = 1 - (i * 0.1); // Decrease opacity
        ctx.fillStyle = 'green';
        ctx.fillRect(x - (i * dx), y, 50, 50);
    }

    ctx.globalAlpha = 1; // Reset globalAlpha

    x += dx;
    if (x > canvas.width + 50) {
        x = -50;
    }

    requestAnimationFrame(drawMotionBlur);
}

drawMotionBlur();


`
    body { margin: 0; background-color: black; }
.fullscreen-wrapper {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    display: flex;
    justify-content: center;
    align-items: center;
}
canvas {
    max-width: 100%;
    max-height: 100%;
    /* Optional: for crisp pixel art, though can have aliasing effects */
    /* image-rendering: pixelated; */
}

`


const NATIVE_WIDTH = 800;
const NATIVE_HEIGHT = 600;
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeGame() {
    const wrapper = canvas.parentElement;
    const deviceWidth = wrapper.clientWidth;
    const deviceHeight = wrapper.clientHeight;

    // Calculate the scale factor to fit the native resolution within the current view
    const scaleFactor = Math.min(deviceWidth / NATIVE_WIDTH, deviceHeight / NATIVE_HEIGHT);

    // Set the canvas element's drawing buffer size (actual pixels) to the native resolution
    // This is the size your game logic will operate in
    canvas.width = NATIVE_WIDTH;
    canvas.height = NATIVE_HEIGHT;

    // Set the canvas element's display size using CSS pixels to scale it up/down
    canvas.style.width = `${NATIVE_WIDTH * scaleFactor}px`;
    canvas.style.height = `${NATIVE_HEIGHT * scaleFactor}px`;

    // Important: Reset the canvas transform matrix (optional if you don't use ctx.scale otherwise)
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // Optional: scale the context to account for high DPI screens for sharpness (devicePixelRatio)
    // const dpr = window.devicePixelRatio || 1;
    // canvas.width = NATIVE_WIDTH * dpr;
    // canvas.height = NATIVE_HEIGHT * dpr;
    // ctx.scale(dpr, dpr);
}

// Initial resize and add event listener
window.addEventListener('load', resizeGame);
window.addEventListener('resize', resizeGame);



/* ======================================================================================================= */



function continuousCollisionDetection(obj1, obj2, deltaTime) {
    // Relative velocity
    const relativeVx = obj2.velocity.x - obj1.velocity.x;
    const relativeVy = obj2.velocity.y - obj1.velocity.y;

    // Calculate time of impact for each axis
    let tx_entry, tx_exit, ty_entry, ty_exit;

    // X-axis
    if (relativeVx > 0) {
        tx_entry = (obj2.position.x - (obj1.position.x + obj1.width)) / relativeVx;
        tx_exit = ((obj2.position.x + obj2.width) - obj1.position.x) / relativeVx;
    } else if (relativeVx < 0) {
        tx_entry = ((obj2.position.x + obj2.width) - obj1.position.x) / relativeVx;
        tx_exit = (obj2.position.x - (obj1.position.x + obj1.width)) / relativeVx;
    } else { // No relative velocity on X-axis
        if (obj1.position.x + obj1.width <= obj2.position.x || obj2.position.x + obj2.width <= obj1.position.x) {
            return null; // No collision possible
        }
        tx_entry = -Infinity;
        tx_exit = Infinity;
    }

    // Y-axis (similar logic as X-axis)
    if (relativeVy > 0) {
        ty_entry = (obj2.position.y - (obj1.position.y + obj1.height)) / relativeVy;
        ty_exit = ((obj2.position.y + obj2.height) - obj1.position.y) / relativeVy;
    } else if (relativeVy < 0) {
        ty_entry = ((obj2.position.y + obj2.height) - obj1.position.y) / relativeVy;
        ty_exit = (obj2.position.y - (obj1.position.y + obj1.height)) / relativeVy;
    } else { // No relative velocity on Y-axis
        if (obj1.position.y + obj1.height <= obj2.position.y || obj2.position.y + obj2.height <= obj1.position.y) {
            return null; // No collision possible
        }
        ty_entry = -Infinity;
        ty_exit = Infinity;
    }

    // Find the actual time of entry and exit
    const timeOfEntry = Math.max(tx_entry, ty_entry);
    const timeOfExit = Math.min(tx_exit, ty_exit);

    // Check for collision within the time step
    if (timeOfEntry < timeOfExit && timeOfEntry < deltaTime && timeOfEntry >= 0) {
        return timeOfEntry; // Collision detected at this time
    }

    return null; // No collision within the time step
}



/* ======================================================================================================= */



function checkAABBCollision(rect1, rect2) {
    // Calculate Minkowski Difference properties
    const mdX = rect1.x - rect2.x - rect2.width;
    const mdY = rect1.y - rect2.y - rect2.height;
    const mdWidth = rect1.width + rect2.width;
    const mdHeight = rect1.height + rect2.height;

    // Check if origin (0,0) is within the Minkowski Difference
    return (
        0 >= mdX &&
        0 <= mdX + mdWidth &&
        0 >= mdY &&
        0 <= mdY + mdHeight
    );
}

// Example usage with Canvas
const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

const rectA = { x: 50, y: 50, width: 100, height: 75 };
const rectB = { x: 120, y: 80, width: 80, height: 60 };

function drawRect(rect, color) {
    ctx.fillStyle = color;
    ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const collision = checkAABBCollision(rectA, rectB);

    drawRect(rectA, collision ? 'red' : 'blue');
    drawRect(rectB, collision ? 'red' : 'green');

    requestAnimationFrame(animate);
}

animate();



/* ======================================================================================================= */



class GameObject {
    constructor(x, y, width, height, vx = 0, vy = 0) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.vx = vx;
        this.vy = vy;
    }

    // Method to update position (for discrete updates or after CCD)
    update(deltaTime) {
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
    }

    // Method to draw the object on the canvas
    draw(ctx) {
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

// Function to perform swept AABB collision detection
function sweptAABB(obj1, obj2, deltaTime) {
    // Calculate relative velocity
    const relVx = obj1.vx - obj2.vx;
    const relVy = obj1.vy - obj2.vy;

    // Create a "swept" bounding box for obj1 relative to obj2
    // This is essentially the Minkowski sum of obj1's swept path and obj2
    const minX = obj2.x - (obj1.x + obj1.width);
    const maxX = (obj2.x + obj2.width) - obj1.x;
    const minY = obj2.y - (obj1.y + obj1.height);
    const maxY = (obj2.y + obj2.height) - obj1.y;

    let timeX = -Infinity;
    let timeY = -Infinity;
    let timeEntry = -Infinity;
    let timeExit = Infinity;

    // Calculate time of entry and exit for each axis
    if (relVx !== 0) {
        timeEntry = Math.max(timeEntry, minX / relVx, maxX / relVx);
        timeExit = Math.min(timeExit, minX / relVx, maxX / relVx);
    }
    if (relVy !== 0) {
        timeEntry = Math.max(timeEntry, minY / relVy, maxY / relVy);
        timeExit = Math.min(timeExit, minY / relVy, maxY / relVy);
    }

    // If there's no overlap or collision time is outside the delta time, no collision within this step
    if (timeEntry > timeExit || timeEntry > deltaTime || timeEntry < 0) {
        return null; // No collision
    }

    return timeEntry; // Return the time of collision
}

const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const player = new GameObject(50, 50, 30, 30, 100, 0); // Moving object
const wall = new GameObject(300, 50, 20, 100); // Static object

let lastTime = 0;

function animate(currentTime) {
    const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
    lastTime = currentTime;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Perform CCD
    const collisionTime = sweptAABB(player, wall, deltaTime);

    if (collisionTime !== null) {
        // Collision detected, update up to collision point
        player.update(collisionTime);
        // Resolve collision (e.g., reverse player's horizontal velocity)
        player.vx *= -1;
        // Update for remaining time after collision
        player.update(deltaTime - collisionTime);
    } else {
        // No collision, update normally
        player.update(deltaTime);
    }

    player.draw(ctx);
    wall.draw(ctx);

    requestAnimationFrame(animate);
}

animate(0);



/* ======================================================================================================= */



function checkSweptAABBCollision(rect1, rect2, velocityX, velocityY) {
    // Calculate relative velocity
    const relativeVx = velocityX;
    const relativeVy = velocityY;

    // Calculate time of entry and exit for each axis
    let txEntry, tyEntry;
    let txExit, tyExit;

    // X-axis
    if (relativeVx > 0) {
        txEntry = (rect2.x - (rect1.x + rect1.width)) / relativeVx;
        txExit = ((rect2.x + rect2.width) - rect1.x) / relativeVx;
    } else {
        txEntry = ((rect2.x + rect2.width) - rect1.x) / relativeVx;
        txExit = (rect2.x - (rect1.x + rect1.width)) / relativeVx;
    }

    // Y-axis
    if (relativeVy > 0) {
        tyEntry = (rect2.y - (rect1.y + rect1.height)) / relativeVy;
        tyExit = ((rect2.y + rect2.height) - rect1.y) / relativeVy;
    } else {
        tyEntry = ((rect2.y + rect2.height) - rect1.y) / relativeVy;
        tyExit = (rect2.y - (rect1.y + rect1.height)) / relativeVy;
    }

    // Find the largest entry time and smallest exit time
    const timeEntry = Math.max(txEntry, tyEntry);
    const timeExit = Math.min(txExit, tyExit);

    // If timeEntry < timeExit and timeEntry < 1 (collision within current frame) and timeEntry >= 0
    if (timeEntry < timeExit && timeEntry < 1 && timeEntry >= 0) {
        return {
            collided: true,
            collisionTime: timeEntry
        };
    } else {
        return {
            collided: false,
            collisionTime: -1
        };
    }
}

// Example usage in your game loop:
function update(deltaTime) {
    // Assume ball and wall are objects with x, y, width, height properties
    // and ball has a velocityX, velocityY
    const collisionResult = checkSweptAABBCollision(ball, wall, ball.velocityX * deltaTime, ball.velocityY * deltaTime);

    if (collisionResult.collided) {
        // Adjust position to just before collision
        ball.x += ball.velocityX * collisionResult.collisionTime;
        ball.y += ball.velocityY * collisionResult.collisionTime;

        // Handle collision response (e.g., reverse velocity)
        ball.velocityX *= -1;
        ball.velocityY *= -1;
    } else {
        // Move normally if no collision predicted
        ball.x += ball.velocityX * deltaTime;
        ball.y += ball.velocityY * deltaTime;
    }
}



/* ======================================================================================================= */



class Circle {
    constructor(x, y, radius) {
        this.x = x;
        this.y = y;
        this.radius = radius;
    }
}

class Rectangle {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }
}

/**
 * Performs swept AABB collision detection between a moving circle and a static rectangle.
 * @param {Circle} circle The moving circle.
 * @param {number} vx The velocity of the circle in the x-direction.
 * @param {number} vy The velocity of the circle in the y-direction.
 * @param {Rectangle} rect The static rectangle.
 * @returns {object|null} Collision information (entryTime, normalX, normalY) or null if no collision.
 */
function sweptCircleRectangleCollision(circle, vx, vy, rect) {
    // Expand the rectangle by the circle's radius to treat the circle as a point
    // colliding with an expanded AABB.
    const expandedRect = {
        x: rect.x - circle.radius,
        y: rect.y - circle.radius,
        width: rect.width + 2 * circle.radius,
        height: rect.height + 2 * circle.radius
    };

    // Calculate entry and exit times for X and Y axes
    let xInvEntry, yInvEntry;
    let xInvExit, yInvExit;

    // Find the distance between the objects on the near and far sides for the X axis
    if (vx > 0) {
        xInvEntry = expandedRect.x - circle.x;
        xInvExit = (expandedRect.x + expandedRect.width) - circle.x;
    } else {
        xInvEntry = (expandedRect.x + expandedRect.width) - circle.x;
        xInvExit = expandedRect.x - circle.x;
    }

    // Find the distance between the objects on the near and far sides for the Y axis
    if (vy > 0) {
        yInvEntry = expandedRect.y - circle.y;
        yInvExit = (expandedRect.y + expandedRect.height) - circle.y;
    } else {
        yInvEntry = (expandedRect.y + expandedRect.height) - circle.y;
        yInvExit = expandedRect.y - circle.y;
    }

    let xEntry, yEntry;
    let xExit, yExit;

    // Calculate time of collision and time of leaving for X and Y axes
    if (vx === 0) {
        xEntry = -Infinity;
        xExit = Infinity;
    } else {
        xEntry = xInvEntry / vx;
        xExit = xInvExit / vx;
    }

    if (vy === 0) {
        yEntry = -Infinity;
        yExit = Infinity;
    } else {
        yEntry = yInvEntry / vy;
        yExit = yInvExit / vy;
    }

    // Find the earliest time of collision
    const entryTime = Math.max(xEntry, yEntry);
    // Find the latest time of leaving
    const exitTime = Math.min(xExit, yExit);

    // If there's no collision, or if the collision happened in the past, or if objects are already separated
    if (entryTime > exitTime || xEntry < 0 && yEntry < 0 || entryTime > 1) {
        return null; // No collision within the current movement frame (0 to 1)
    } else {
        // Collision occurred, determine the normal of the collided surface
        let normalX = 0;
        let normalY = 0;

        if (xEntry > yEntry) {
            if (xInvEntry < 0) {
                normalX = 1;
            } else {
                normalX = -1;
            }
        } else {
            if (yInvEntry < 0) {
                normalY = 1;
            } else {
                normalY = -1;
            }
        }
        return {
            entryTime: entryTime,
            normalX: normalX,
            normalY: normalY
        };
    }
}

// Example Usage:
const movingCircle = new Circle(10, 10, 5);
const staticRectangle = new Rectangle(50, 50, 20, 20);
const circleVelocityX = 70;
const circleVelocityY = 70;

const collisionInfo = sweptCircleRectangleCollision(
    movingCircle,
    circleVelocityX,
    circleVelocityY,
    staticRectangle
);

if (collisionInfo) {
    console.log(`Collision detected at time: ${collisionInfo.entryTime}`);
    console.log(`Collision normal: (${collisionInfo.normalX}, ${collisionInfo.normalY})`);
} else {
    console.log("No collision detected.");
}



/* ======================================================================================================= */



function checkSweptAABBCollision(rect1, rect2, dx, dy) {
    // rect1: {x, y, width, height}
    // rect2: {x, y, width, height}
    // dx, dy: movement of rect1 in this frame

    // Calculate the swept AABB for rect1
    const sweptRect1 = {
        x: Math.min(rect1.x, rect1.x + dx),
        y: Math.min(rect1.y, rect1.y + dy),
        width: rect1.width + Math.abs(dx),
        height: rect1.height + Math.abs(dy)
    };

    // Check for overlap between the swept AABB and rect2
    if (sweptRect1.x < rect2.x + rect2.width &&
        sweptRect1.x + sweptRect1.width > rect2.x &&
        sweptRect1.y < rect2.y + rect2.height &&
        sweptRect1.y + sweptRect1.height > rect2.y) {

        // A potential collision occurred.
        // Further calculations would be needed to determine the exact time and point of impact.
        return true;
    }
    return false;
}



/* ======================================================================================================= */


function collision(rect, circle) {
    // Find the closest point on the rectangle to the circle's center
    let NearestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width));
    let NearestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height));

    // Calculate the distance between the closest point and the circle's center
    let dx = circle.x - NearestX;
    let dy = circle.y - NearestY;
    let distanceSquared = dx * dx + dy * dy;

    // Check if collision occurred
    if (distanceSquared < circle.radius * circle.radius) {
        // Collision detected

        // Calculate collision normal (vector from closest point to circle center)
        let distance = Math.sqrt(distanceSquared);
        // Ensure distance is not zero to avoid division by zero
        if (distance === 0) {
            distance = 0.01; // Small value to prevent error
        }
        let normalX = dx / distance;
        let normalY = dy / distance;

        // Reposition the ball to prevent sticking (positional resolution)
        let overlap = circle.radius - distance;
        circle.x += normalX * overlap;
        circle.y += normalY * overlap;

        // Reflect velocity using the reflection formula R = V - 2 * dot(V, N) * N
        let dotProduct = circle.dx * normalX + circle.dy * normalY;
        circle.dx -= 2 * dotProduct * normalX;
        circle.dy -= 2 * dotProduct * normalY;

        // Optional: you could get the new angle here using Math.atan2(circle.dy, circle.dx)
        // let newAngle = Math.atan2(circle.dy, circle.dx);
    }
}



/* ======================================================================================================= */



function checkCircleCollision(c1, c2) {
    const dx = c2.x - c1.x;
    const dy = c2.y - c1.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < c1.radius + c2.radius) {
        // Collision detected
        // Basic response: reflect velocities along the collision normal
        const normalX = dx / distance;
        const normalY = dy / distance;

        const relativeVelocityX = c2.vx - c1.vx;
        const relativeVelocityY = c2.vy - c1.vy;

        const dotProduct = relativeVelocityX * normalX + relativeVelocityY * normalY;

        if (dotProduct < 0) { // Only reflect if objects are moving towards each other
            const impulse = -2 * dotProduct / (c1.mass + c2.mass); // Simplified impulse

            c1.vx -= impulse * c2.mass * normalX;
            c1.vy -= impulse * c2.mass * normalY;
            c2.vx += impulse * c1.mass * normalX;
            c2.vy += impulse * c1.mass * normalY;
        }

        // Optional: Resolve overlap to prevent sticking
        const overlap = (c1.radius + c2.radius) - distance;
        const adjustX = overlap / 2 * normalX;
        const adjustY = overlap / 2 * normalY;
        c1.x -= adjustX;
        c1.y -= adjustY;
        c2.x += adjustX;
        c2.y += adjustY;
    }
}



/* ======================================================================================================= */



function updateVelocityAngle(object, newAngle) {
    object.angle = degToRad(newAngle);
    // Calculate new velocity components
    object.vx = object.speed * Math.cos(object.angle);
    object.vy = object.speed * Math.sin(object.angle);
}
function applyAcceleration(object, magnitude, accelerationAngle) {
    // Calculate acceleration components
    object.ax = magnitude * Math.cos(accelerationAngle);
    object.ay = magnitude * Math.sin(accelerationAngle);
}

// In the animation loop, update velocity using acceleration:
function updateObjectPosition(object) {
    object.vx += object.ax; // acceleration changes velocity
    object.vy += object.ay;
    object.x += object.vx; // velocity changes position
    object.y += object.vy;
}




/* ======================================================================================================= */



let closestX = circleX
let closestY = circleY

// Clamp x-coordinate
if (circleX < rectX) {
    closestX = rectX
} else if (circleX > rectX + rectWidth) {
    closestX = rectX + rectWidth
}

// Clamp y-coordinate
if (circleY < rectY) {
    closestY = rectY
} else if (circleY > rectY + rectHeight) {
    closestY = rectY + rectHeight
}

if (closestX === rx && closestY === ry) {
    // Corner case: top-left
    side = "top-left corner";

  } else if (closestX === rx + rw && closestY === ry) {
    // Corner case: top-right
    side = "top-right corner";

  } else if (closestX === rx && closestY === ry + rh) {
    // Corner case: bottom-left
    side = "bottom-left corner";

  } else if (closestX === rx + rw && closestY === ry + rh) {
    // Corner case: bottom-right
    side = "bottom-right corner";

  } else if (closestX === rx) {
    side = "left";

  } else if (closestX === rx + rw) {
    side = "right";

  } else if (closestY === ry) {
    side = "top";

  } else if (closestY === ry + rh) {
    side = "bottom";

  } else {
    // Circle center is inside the rectangle
    // Find the closest edge based on distances to each edge
    const distToLeft = Math.abs(cx - rx);
    const distToRight = Math.abs(cx - (rx + rw));
    const distToTop = Math.abs(cy - ry);
    const distToBottom = Math.abs(cy - (ry + rh));

    const minXDist = Math.min(distToLeft, distToRight);
    const minYDist = Math.min(distToTop, distToBottom);

    if (minXDist < minYDist) {
      side = distToLeft < distToRight ? "left" : "right";

    } else {
      side = distToTop < distToBottom ? "top" : "bottom";
    }
  }
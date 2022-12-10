const globalSVG = new SVG( "#waterworld" )

const numSegments = 100
const radius = 40
const centerX = 50
const centerY = 50

// An array to store the paths
const paths = []

// Create the paths
for ( let i = 0; i < 6; i++ ) {
    const path = new SVG.path()

    // Add the first point of the circle
    path.point(centerX + radius, centerY)

    // Add the remaining points of the circle
    for ( let j = 1; j < numSegments; j++ ) {
        const angle = (2 * Math.PI / numSegments) * j
        const x = centerX + radius * Math.cos(angle)
        const y = centerY + radius * Math.sin(angle)
        path.point(x, y)
    }

    path.close()
    path.width(5)

    // Set a different shade of blue for each path
    path.color(`rgb(0, 0, ${i * 255/6})`)

    path.update()

    // Set a different rate of rotation for each path
    path.onUpdate((path, time) => {
        path.pathPoints = path.pathPoints.map((point, o) => {
            const angle = (2 * Math.PI / numSegments) * o
            point.x = centerX + (radius - i * 5 + (Math.sin(time/1000 * (i + 1) + angle * 5) * radius * 0.1)) * Math.cos(angle) 
            point.y = centerY + (radius - i * 5 + (Math.sin(time/1000 * (i + 1) + angle * 5) * radius * 0.1)) * Math.sin(angle)
            return point
        })
    })

    // Add the path to the array
    paths.push(path)

    // Add the path to the global SVG element
    globalSVG.add(path)
}

// Animate the paths
requestAnimationFrame(update = function(time) {
    paths.forEach(path => path.update(time))
    requestAnimationFrame(update)
})

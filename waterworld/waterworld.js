const globalSVG = new SVG( "#waterworld" )
const path = new SVGPath()

const numSegments = 250
const radius = 40
const centerX = 50
const centerY = 50

// Add the first point of the circle
path.point(centerX + radius, centerY)

// Add the remaining points of the circle
for ( let i = 1; i < numSegments; i++ ) {
    const angle = (2 * Math.PI / numSegments) * i
    const x = centerX + radius * Math.cos(angle)
    const y = centerY + radius * Math.sin(angle)
    path.point(x, y)
}

path.close()
path.width(5)
path.color("lightblue")
path.update()

path.onUpdate((path, time) => {
    path.pathPoints = path.pathPoints.map((point, i) => {
        const angle = (2 * Math.PI / numSegments) * i
        point.x = centerX + (radius + (Math.sin(time/1000 + angle * 10) * radius * 0.1)) * Math.cos(angle) 
        point.y = centerY + (radius + (Math.sin(time/1000 + angle * 10) * radius * 0.1)) * Math.sin(angle)
        return point
    })
})

// Add the path to the global SVG element
globalSVG.add(path)

requestAnimationFrame(update = function(time) {
    path.update(time)
    requestAnimationFrame(update)
})

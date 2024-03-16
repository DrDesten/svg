import { SVG } from "../svg.js"

const globalSVG = new SVG( "#canvas" )

const maxCorners = 16
const maxRadius = 32
const centerX = 50
const centerY = 50

const layers = 10

for ( let i = 0; i < layers; i++ ) {

    let path = new SVG.path().mode("bezier")

    const radius  = maxRadius - i * ( maxRadius / layers )
    const corners = maxCorners - ~~( i * ~~( maxCorners / layers / 2) * 2 ) + 2
    
    path.color(`rgb(${i * 255/(layers-1)}, 0, 0)`)
    path.width(Math.max(5, radius))

    for ( let o = 0; o < corners; o++ ) {

        let sub = (o % 2) * radius / 4
    
        const angle = (2 * Math.PI) * (o / corners) + i**.5
        const x = centerX + (radius - sub) * Math.cos(angle) 
        const y = centerY + (radius - sub) * Math.sin(angle)
        path.point(x, y)
    
    }

    path.close()
    path.update()

    globalSVG.add(path)

}

globalSVG.add(
    new SVG.circle().center(50,50).radius(2).fill("#e00").update()
)
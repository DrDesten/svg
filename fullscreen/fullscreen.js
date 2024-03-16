import { SVG } from "../svg.js"

const globalSVG = new SVG( "#canvas", "cover" )
const topSVG = new SVG( "#canvas-top", "cover" )

const angle = Math.PI / 4
const lines = []
{
    const maxWidth = 1
    const maxLength = 10
    const minLength = 0.5

    for ( let i = 0; i < 100; i++ ) {
        const line = new SVG.line().color("white")

        const length = Math.random() ** 10 * (maxLength - minLength) + minLength
        line.width( length / maxLength * maxWidth )
        line.opacity( (length / (maxLength + minLength) + minLength ) ** .1 )

        const start = new SVG.vector( Math.random(), Math.random() ).mul(100)
        const end   = start.add( new SVG.vector( Math.sin(angle), Math.cos(angle) ).mul(length) )

        line.start(start.x, start.y).end(end.x, end.y)

        line.onUpdate((line, time) => {
            const angleVector  = new SVG.vector( Math.sin(angle), Math.cos(angle) )
            const offsetVector = angleVector.mul(time / 1000 * length )
            const lineStart = start.add( offsetVector )
            lineStart.x = lineStart.x % (100 + length) - length
            lineStart.y = lineStart.y % (100 + length) - length
            const lineEnd   = lineStart.add( angleVector.mul(length) )
            line.start(lineStart.x, lineStart.y)
            line.end(lineEnd.x, lineEnd.y)
        })

        lines.push(line)
    }
}
{
    const maxWidth = 1
    const maxLength = 30
    const minLength = 10

    for ( let i = 0; i < 7; i++ ) {
        const line = new SVG.line().color("#FE2")

        const length = Math.random() * (maxLength - minLength) + minLength
        line.width( length / maxLength * maxWidth )

        const start = new SVG.vector( Math.random(), Math.random() ).mul(100)
        const end   = start.add( new SVG.vector( Math.sin(angle), Math.cos(angle) ).mul(length) )

        line.start(start.x, start.y).end(end.x, end.y)

        line.onUpdate((line, time) => {
            const angleVector  = new SVG.vector( Math.sin(angle), Math.cos(angle) )
            const offsetVector = angleVector.mul(time / 1000 * length )
            const lineStart = start.add( offsetVector )
            lineStart.x = lineStart.x % (100 + length) - length
            lineStart.y = lineStart.y % (100 + length) - length
            const lineEnd   = lineStart.add( angleVector.mul(length) )
            line.start(lineStart.x, lineStart.y)
            line.end(lineEnd.x, lineEnd.y)
        })

        lines.push(line)
    }
}

let update
globalSVG.add(...lines)
requestAnimationFrame( update = function(time){
    lines.forEach( line => line.update(time) )
    requestAnimationFrame( update )
})

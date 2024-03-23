import { SVG, Vector2D as vec, VectorMath as vmath } from "../svg.js"

const globalSVG = new SVG( "#canvas", "fit" )

let mousePressed = 0
const mousePos = vec.zero
const mappedMousePos = vec.zero

document.addEventListener( "mousemove", e => {
    mousePos.xy = new vec( e.clientX, e.clientY )

    const rect = globalSVG.svg.getBoundingClientRect()
    const relative = mousePos.sub( vec.new( rect ) )
    const scaled = relative.div( new vec(
        rect.right - rect.left,
        rect.bottom - rect.top
    ) )
    mappedMousePos.xy = new vec( scaled.x, 1 - scaled.y )
} )

document.addEventListener( "mousedown", e => {
    if ( e.button === 0 ) {
        mousePressed = 1
    }
    if ( e.button === 1 ) {
        mousePressed = -1
    }
} )
document.addEventListener( "mouseup", () => mousePressed = 0 )

class Boid {
    /** @param {vec} pos */
    constructor( pos ) {
        this.pos = pos
        this.vel = vec.zero
        this.acc = vec.zero
    }
}

const count = 1000
const size = 0.3
const boids = Array.from( { length: count } ).map( () => new Boid( vec.randomCircle().mul( Math.SQRT1_2 ).add( .5 ) ) )
const elements = Array.from( { length: count } ).map( () => new SVG.line().width( size ) )

console.log( boids )

function tick() {

    for ( const boid of boids ) {
        boid.acc = vec.zero

        boid.acc = boid.acc.add( vec.randomCircle().mul( 0.0005 ) )

        const mouseDistance = vec.distance( mappedMousePos, boid.pos )
        const mouseForce = boid.pos.sub( mappedMousePos ).normalize()
            .mul( ( mouseDistance + 0.25 ) ** -2 )
            .mul( mousePressed * ( mousePressed > 0 ? 0.5 : 1 ) )
            .mul( 0.0005 )
        boid.acc = boid.acc.add( mouseForce )

        const friction = boid.vel.mul( -0.02 )
        boid.acc = boid.acc.add( friction )

        boid.vel = boid.vel.add( boid.acc )

        if ( vec.distance( boid.pos, vec.new( .5 ) ) > Math.SQRT2 / 1.5 && vec.distance( boid.pos.add( boid.vel ), vec.new( .5 ) ) > vec.distance( boid.pos, vec.new( .5 ) ) ) {
            boid.vel = vec.zero
        } else {
            boid.pos = boid.pos.add( boid.vel )
        }
    }

    for ( let i = 0; i < count; i++ ) {
        const boid = boids[i]
        const ele = elements[i]

        let mappedPos = boid.pos.mul( 100 )
        let mappedVel = mappedPos.sub( boid.vel.mul( 100 ) )

        let opacity = Math.sqrt( 1 / ( 1 + vec.distance( mappedPos, mappedVel ) / size ) )
        let color = [255, 255, 255]

        let red = boid.vel.normalize().sub( boid.acc.normalize() ).length() * boid.acc.length() ** 2
        red = ( red * 10000 + 1 ) ** -2
        color[1] *= red
        color[2] *= red

        /* let blue = boid.vel.length() * red 
        blue = blue ** -2
        color[0] *= blue
        color[1] *= blue */

        ele.start( ...mappedPos ).end( ...mappedVel ).color( `rgb(${color[0]}, ${color[1]}, ${color[2]})` ).opacity( opacity ).update()
    }

}


let update
globalSVG.add( ...elements )
requestAnimationFrame( update = function ( time ) {
    tick()
    requestAnimationFrame( update )
} )

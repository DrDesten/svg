import { SVG, vec2, vec3 } from "../svg.js"

const globalSVG = new SVG( "#canvas", "fit" )

let mousePressed = 0
const mousePos = new vec2
const mappedMousePos = new vec2

document.addEventListener( "mousemove", e => {
    mousePos.xy = new vec2( e.clientX, e.clientY )

    const rect = globalSVG.svg.getBoundingClientRect()
    const relative = mousePos.clone().sub( new vec2( rect ) )
    const scaled = relative.clone().div( new vec2( rect.width, rect.height ) )
    mappedMousePos.xy = new vec2( scaled.x, 1 - scaled.y )
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
    /** @param {vec2} pos */
    constructor( pos ) {
        this.pos = pos
        this.vel = new vec2
        this.acc = new vec2
    }
}

const count = 1000
const size = 0.3
const boids = Array.from( { length: count }, () => new Boid( vec2.randomSphere().mul( Math.SQRT1_2 ).add( .5 ) ) )
const elements = Array.from( { length: count }, () => new SVG.line().width( size ) )

console.log( boids )

function tick() {

    for ( const boid of boids ) {
        boid.acc = new vec2

        boid.acc.add( vec2.randomSphere().mul( 0.0005 ) )

        const mouseDistance = vec2.distance( mappedMousePos, boid.pos )
        const mouseForce = boid.pos.clone()
            .sub( mappedMousePos ).normalize()
            .mul( ( mouseDistance + 0.25 ) ** -2 )
            .mul( mousePressed * ( mousePressed > 0 ? 0.5 : 1 ) )
            .mul( 0.0005 )
        boid.acc.add( mouseForce )

        const friction = boid.vel.clone().mul( -0.02 )
        boid.acc.add( friction )

        boid.vel.add( boid.acc )

        if (
            vec2.distance( boid.pos, new vec2( .5 ) ) > Math.SQRT2 / 1.5 &&
            vec2.distance( boid.pos.clone().add( boid.vel ), new vec2( .5 ) ) > vec2.distance( boid.pos, new vec2( .5 ) )
        ) {
            boid.vel = new vec2
        } else {
            boid.pos.add( boid.vel )
        }
    }

    for ( let i = 0; i < count; i++ ) {
        const boid = boids[i]
        const ele = elements[i]

        let mappedPos = boid.pos.clone().mul( 100 )
        let mappedVel = mappedPos.clone().sub( boid.vel.clone().mul( 100 ) )

        let opacity = Math.sqrt( 1 / ( 1 + vec2.distance( mappedPos, mappedVel ) / size ) )
        let color = new vec3( 1 )

        let speed = boid.vel.length()
        let red = vec2.normalize( boid.vel ).sub( vec2.normalize( boid.acc ) ).length() * boid.acc.length() ** 2
        red = ( red * 10000 + 1 ) ** -2

        let blue = new vec2( ( speed * 50 ) ** 2 )
            .apply( v => v / ( v + 1 ) )
            .mul( new vec2( 1, 0.7 ) )
            .apply( v => 1 - v * red )

        color.g *= red
        color.b *= red
        color.r *= blue.x
        color.g *= blue.y

        ele.start( ...mappedPos ).end( ...mappedVel ).color( `rgb(${[...vec3.mul( color, 255 )]})` ).opacity( opacity ).update()
    }

}


let update
globalSVG.add( ...elements )
requestAnimationFrame( update = function ( time ) {
    tick()
    requestAnimationFrame( update )
} )

import { SVG, Vector2D as vec } from "../svg.js"

const globalSVG = new SVG( "#waterworld" )

const numSegments = 200
const radius = 40
const center = vec.new( 50 )

// An array to store the paths
const paths = []

// Create the paths
for ( let i = 0; i < 7; i++ ) {
    const path = new SVG.path().width( 4.625 )

    // Add the first point of the circle
    path.point( center.x + radius, center.y )

    // Add the remaining points of the circle
    for ( let j = 1; j < numSegments; j++ ) {
        const angle = ( 2 * Math.PI / numSegments ) * j
        path.point( ...vec.fromAngle( angle ).mul( radius ).add( center ) )
    }

    path.close()

    // Set a different shade of blue for each path
    path.color( `rgb(0, 0, ${i * 255 / 6})` )

    path.update()

    // Set a different rate of rotation for each path
    path.onUpdate( ( path, time ) => {
        path.pathPoints = path.pathPoints.map( ( point, o ) => {
            const angle = ( 2 * Math.PI / numSegments ) * o
            const r = radius - i * 4.5 + ( Math.sin( time / 1000 * ( i + 1 ) + angle * 5 ) * radius * 0.1 )
            point.xy = vec.fromAngle( angle ).mul( r ).add( center )
            return point
        } )
    } )

    // Add the path to the array
    paths.push( path )

    // Add the path to the global SVG element
    globalSVG.add( path )
}

// Animate the paths
let update
requestAnimationFrame( update = function ( time ) {
    paths.forEach( path => path.update( time ) )
    requestAnimationFrame( update )
} )

import { SVG, vec2 } from "../svg.js"

const globalSVG = new SVG( "#canvas", "cover" )
const topSVG = new SVG( "#canvas-top", "cover" )

const angle = Math.PI / 4
const lines = []
{
    const maxWidth = 1
    const maxLength = 10
    const minLength = 0.5

    for ( let i = 0; i < 100; i++ ) {
        const line = new SVG.line().color( "white" )

        const length = Math.random() ** 10 * ( maxLength - minLength ) + minLength
        line.width( length / maxLength * maxWidth )
        line.opacity( ( length / ( maxLength + minLength ) + minLength ) ** .1 )

        const start = vec2.random().mul( 100 )
        const end = start.clone().add( vec2.fromAngle( angle ).mul( length ) )

        line.start( ...start ).end( ...end )

        line.onUpdate( ( line, time ) => {
            const angleVector = vec2.fromAngle( angle )
            const offsetVector = angleVector.clone().mul( time / 1000 * length )
            const lineStart = start.clone().add( offsetVector )
            lineStart.apply( x => x % ( 100 + length ) - length )
            const lineEnd = lineStart.clone().add( angleVector.clone().mul( length ) )
            line.start( ...lineStart )
            line.end( ...lineEnd )
        } )

        lines.push( line )
    }
}
{
    const maxWidth = 1
    const maxLength = 30
    const minLength = 10

    for ( let i = 0; i < 7; i++ ) {
        const line = new SVG.line().color( "#FE2" )

        const length = Math.random() * ( maxLength - minLength ) + minLength
        line.width( length / maxLength * maxWidth )

        const start = vec2.random().mul( 100 )
        const end = start.clone().add( vec2.fromAngle( angle ).mul( length ) )

        line.start( ...start ).end( ...end )

        line.onUpdate( ( line, time ) => {
            const angleVector = vec2.fromAngle( angle )
            const offsetVector = angleVector.clone().mul( time / 1000 * length )
            const lineStart = start.clone().add( offsetVector )
            lineStart.apply( x => x % ( 100 + length ) - length )
            const lineEnd = lineStart.clone().add( angleVector.clone().mul( length ) )
            line.start( ...lineStart )
            line.end( ...lineEnd )
        } )

        lines.push( line )
    }
}

let update
globalSVG.add( ...lines )
requestAnimationFrame( update = function ( time ) {
    lines.forEach( line => line.update( time ) )
    requestAnimationFrame( update )
} )

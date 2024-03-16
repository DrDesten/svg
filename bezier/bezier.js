import { SVG, Vector2D as vec } from "../svg.js"

const globalSVG = new SVG( "#canvas" )

let revolutions = 2
let points = 10
let scale = 50
let center = vec.new( 50 )

let swirl = new SVG.path().mode( "bezier" ).color( "#800" )
for ( let i = 0; i < points; i++ ) {
    let factor = (i / points) ** 1.5
    let angle = factor * revolutions * Math.PI * 2
    let v = new vec( Math.sin( angle ), Math.cos( angle ) ).mul( scale * factor ).add( center )
    swirl.point( ...v )
}
swirl.update()

let square = new SVG.path().mode( "bezier" )
    .point( 20, 80 )
    .point( 80, 80 )
    .point( 80, 20 )
    .point( 20, 20 )
    .close()
    .update()

globalSVG.add(
    square,
    swirl,
)
function mod( x, mod ) {
    return x > 0 ? x % mod : mod + x % mod
}

function saturate( x ) {
    return Math.max(0, Math.min(1, x))
}
function smoothstepRaw( x ) {
    return (3 - 2 * x) * x * x
}
function smoothstep( x, start, end ) {
    x = saturate( ( x - start ) / ( end - start ) )
    return smoothstepRaw(x)
}
function smootherstep( x, start, end ) {
    x = saturate( ( x - start ) / ( end - start ) )
    return smoothstepRaw(smoothstepRaw(x))
}
function smootheststep( x, start, end ) {
    x = saturate( ( x - start ) / ( end - start ) )
    return smoothstepRaw(smoothstepRaw(smoothstepRaw(x)))
}
function fadeInSmooth( fadeTime, startDelay = 0 ) {
    return function( time ) {
        return smoothstep( time, startDelay, fadeTime + startDelay)
    }
}
function fadeInSmoother( fadeTime , startDelay = 0 ) {
    return function( time ) {
        return smootherstep( time, startDelay, fadeTime + startDelay)
    }
}
function fadeInSmoothest( fadeTime , startDelay = 0 ) {
    return function( time ) {
        return smootheststep( time, startDelay, fadeTime + startDelay)
    }
}


/**
 * Return a SVG, bound to a parent.  
 * Elements within it are relatively positioned [ 0 - 100 ]
 * @param {string} parentQuerySelector 
 */
function SVG( parentQuerySelector ) {
    const initSize = 100 // Size in pixels of SVG
    const parent = document.querySelector( parentQuerySelector )
    const svg    = document.createElementNS("http://www.w3.org/2000/svg", "svg")
    svg.setAttribute("style", `width: ${initSize}px; height: ${initSize}px`)

    // Change the SVG scale with the parent
    const resizeObserver = new ResizeObserver( entries => { 
        const entry = entries[0]
        const size  = [ entry.target.clientWidth, entry.target.clientHeight ]
        svg.style.transform = `translate(${(size[0]-initSize)/2}px,${(size[1]-initSize)/2}px) scale(${size[0]/100},-${size[1]/100})`
    })
    resizeObserver.observe(parent)

    parent.appendChild( svg )
    return svg
}

class SVGTemplate {
    /** @param {string} type */
    constructor( type ) {
        this.ele = document.createElementNS("http://www.w3.org/2000/svg", type)
        this.attributes = {}
    }
    /** @param {string} attribute @param {string} value */
    set( attribute, value ) { return this.ele.setAttribute( attribute, value ), this.attributes[attribute] = value, this }

    /** @param {Object.<string,string>} defaults @param {Object.<string,string>} override */
    setDefaults( defaults, override ) {
        const attributes = Object.assign(defaults, override)
        for ( const attribute in attributes ) this.set(attribute, attributes[attribute])
    }

    // Animation ///////////////////////////////////////////////

    /** @param {number} millisecondsSinceInitialisation */
    update( millisecondsSinceInitialisation = Infinity ) { 
        if ( this.updateCallback != undefined ) this.updateCallback.call(this, this, millisecondsSinceInitialisation)
        return this
    }

    /** @param {(SVGObject: this, millisecondsSinceInitialisation: number)=>void} updateFunction */
    onUpdate( updateFunction ) { return this.updateCallback = updateFunction, this }

    // Style ///////////////////////////////////////////////
    
    /** @param {string} cssColor */
    fill( cssColor )   { return this.set("fill", cssColor), this }
    /** @param {string} cssColor */
    color( cssColor )  { return this.set("stroke", cssColor), this }

    /** @param {number} width */
    width( width )     { return this.set("stroke-width", width), this }
    /** @param {string} linecap */
    linecap( linecap ) { return this.set("stroke-linecap", linecap), this }

    /** @param {number} opacity */
    opacity( opacity ) { return this.set("opacity", opacity), this }


    // Static ///////////////////////////////////////////////

    /** @returns {Object.<string,string>} */
    static get lineDefaults() { return {
        "fill": "none",
        "stroke-width": "10",
        "stroke": "black",
        "stroke-linecap": "round",
    }}
}

class SVGArc extends SVGTemplate {
    /** @param {Object.<string,string>} opts */
    constructor( opts = {} ) {
        super( "path" )

        this.centerPosition = [0,0]
        this.startAngle     = 0
        this.endAngle       = 0
        this.circularRadius = 0

        this.setDefaults(SVGTemplate.lineDefaults, opts)
    }

    /** @param {number} x @param {number} y */
    center( x,y ) {
        this.centerPosition = [ x, y ]
        return this
    }
    /** @param {number} startAngle @param {number} endAngle */
    angles( startAngle, endAngle ) {
        this.startAngle = startAngle
        this.endAngle   = endAngle
        return this
    }
    /** @param {number} startAngle @param {number} endAngle */
    anglesNormalized( startAngle, endAngle ) {
        this.startAngle = startAngle * Math.PI * 2
        this.endAngle   = endAngle * Math.PI * 2
        return this
    }
    /** @param {number} radius */
    radius( radius ) {
        this.circularRadius = radius
        return this
    }

    update( millisecondsSinceInitialisation = Infinity ) {
        if ( this.updateCallback != undefined ) this.updateCallback.call(this, this, millisecondsSinceInitialisation)

        const center = { x: this.centerPosition[0], y: this.centerPosition[1] }
        const angles = { start: this.startAngle, end: this.endAngle }
        const radius = this.circularRadius

        // Calculate Start and End Positions using basic trigonometry
        let startPos = { x: Math.sin(angles.start) * radius + center.x, y: Math.cos(angles.start) * radius + center.y }
        let endPos   = { x: Math.sin(angles.end)   * radius + center.x, y: Math.cos(angles.end)   * radius + center.y}
        // Prevent Flicker when startPos == endPos
        if ( Math.abs(startPos.x - endPos.x) < 0.0001 ) startPos.x += 0.0001
        if ( Math.abs(startPos.y - endPos.y) < 0.0001 ) startPos.y += 0.0001

        let angularLength = (angles.end - angles.start) / ( Math.PI * 2 ) % 1

        let path = ""
        path += `M ${startPos.x} ${startPos.y} ` // Set Start Position
        path += `A ${radius} ${radius} `         // Arc Start: Radius
        path += `0 `                             // Ellipse Rotation
        path += `${+((angularLength > -0.5 && angularLength < 0) || (angularLength > 0.5 && angularLength < 1))} ` // Angle Flag ( true (1) when angular length is larger than 180° )
        path += `0 `                             // Sweep Flag
        path += `${endPos.x} ${endPos.y}`        // Set end Position

        //console.log(angularLength)

        this.set("d", path)
        return this
    }

}
class SVGLine extends SVGTemplate {
    /** @param {Object.<string,string>} opts */
    constructor( opts = {} ) {
        super( "line" )
        this.setDefaults(SVGTemplate.lineDefaults, opts)

        this.coordinateMode = "point"
        this.angleMode = {
            center: [0,0],
            angle:  0,
            startRadius: 0,
            endRadius:   0,
        }
        this.pointMode = {
            start: [0,0],
            end:   [0,0],
        }
    }

    /** @param {"point"|"angle"} coordinateMode */
    mode( coordinateMode ) { return this.coordinateMode = coordinateMode, this }

    /** @param {number} x @param {number} y */
    start( x,y ) { return this.pointMode.start = [x,y], this.set("x1", x).set("y1", y) }
    /** @param {number} x @param {number} y */
    end( x,y )   { return this.pointMode.end = [x,y],   this.set("x2", x).set("y2", y) }

    /** @param {number} x @param {number} y */
    center( x,y )    { return this.angleMode.center = [x,y], this }
    /** @param {number} a */
    angle( a )       { return this.angleMode.angle = a, this }
    /** @param {number} a */
    angleNormalized( a ) { return this.angleMode.angle = a * Math.PI * 2, this }
    /** @param {number} r */
    startRadius( r ) { return this.angleMode.startRadius = r, this }
    /** @param {number} r */
    endRadius( r )   { return this.angleMode.endRadius = r, this }
    /** @param {number} startRadius @param {number} endRadius */
    radii( startRadius, endRadius ) { return this.startRadius(startRadius).endRadius(endRadius) }

    // Animation //////////////////////////////////////////

    /** @param {number} millisecondsSinceInitialisation */
    update( millisecondsSinceInitialisation = Infinity ) { 
        if ( this.updateCallback != undefined ) this.updateCallback.call(this, this, millisecondsSinceInitialisation)
        if ( this.coordinateMode == "point" )
            return this.set("x1", this.pointMode.start[0]).set("y1", this.pointMode.start[1])
                       .set("x2", this.pointMode.end[0])  .set("y2", this.pointMode.end[1])
        
        if ( this.coordinateMode == "angle" ) {

            const unitCircle = [ Math.sin(this.angleMode.angle), Math.cos(this.angleMode.angle) ]
            const startPos   = unitCircle.map( (x,i) => x * this.angleMode.startRadius + this.angleMode.center[i] )
            const endPos     = unitCircle.map( (x,i) => x * this.angleMode.endRadius   + this.angleMode.center[i] )

            return this.set("x1", startPos[0]).set("y1", startPos[1])
                       .set("x2", endPos[0])  .set("y2", endPos[1])
        }
        
        throw new Error(`Mode '${this.coordinateMode}' not Recognized. Available Modes are: 'point', 'angle'`)
    }

}


const globalSVG = SVG( "#clock" )


colors = ["#213","#6de","#8fb"]

const timewarp = 1
const handles = [
    new SVGArc().center(50,50).radius(40).color("#d11").width(10).onUpdate( function(obj, time) {
        // Hour Handle
        const milliseconds = Date.now() - new Date().setHours(0,0,0,0)
        const days         = milliseconds * timewarp / 1000 / 60 / 60 / 12 % 1 // Days since Midnight
        
        const fadeIn   = fadeInSmoothest(5600)(time)
        const fadeWrap = smootheststep( days, (3600*12-5)/(3600*12), 1 ) * fadeIn
        const offset   = (fadeIn - 1) * 1.2
        this.anglesNormalized(offset + fadeWrap * days, offset + fadeIn * days)
        this.opacity( fadeIn )
    }).update(),
    new SVGArc().center(50,50).radius(30).color("#fff").width(8).onUpdate( function(obj, time) {
        // Minute Handle
        const milliseconds = Date.now() - new Date().setMinutes(0,0,0)
        const hours        = milliseconds * timewarp / 1000 / 60 / 60 % 1 // Hours since last Hour
        
        const fadeIn   = fadeInSmoother(4800)(time)
        const fadeWrap = smootheststep( hours, 3595/3600, 1 ) * fadeIn
        const offset   = (fadeIn - 1) * 1.1
        this.anglesNormalized(offset + fadeWrap * hours, offset + fadeIn * hours)
        this.opacity( fadeIn )
    }).update(),
    new SVGArc().center(50,50).radius(22).color("#666").width(6).onUpdate( function(obj, time) {
        // Second Handle
        const milliseconds = Date.now() - new Date().setSeconds(0,0)
        const minutes      = milliseconds * timewarp / 1000 / 60 % 1 // Minutes since last minute
        
        const fadeIn   = fadeInSmooth(4000)(time)
        const fadeWrap = smootheststep( minutes, 55/60, 1 ) * fadeIn
        const offset   = (fadeIn - 1)
        this.anglesNormalized(offset + fadeWrap * minutes, offset + fadeIn * minutes)
        this.opacity( fadeIn )
    }).update(),
]

const handleLines = []
const lineCount = 60
for ( let i = 0; i < lineCount; i++ ) {
    handleLines.push(
        new SVGLine().mode("angle").center(50,50).radii(20.5,23.5).width(0.5).color("#888").angleNormalized( i / lineCount ).onUpdate( function( obj, time ) {
            // Second Handle
            const milliseconds = Date.now() - new Date().setSeconds(0,0)
            const handleAngle  = milliseconds * timewarp / 1000 / 60 % 1 // Minutes since last minute

            const fadeIn = fadeInSmooth(1000, 4500)(time)
            const distanceFade = ( 1 - mod( i / lineCount - handleAngle, 1 ) ) ** 15

            this.opacity( distanceFade * fadeIn )
                
        }).update()
    ),
    handleLines.push(
        new SVGLine().mode("angle").center(50,50).radii(28,32).width(i % 5 ? 0.75 : 1 ).color( i % 15 ? "#888" : "#d11" ).angleNormalized( i / lineCount ).onUpdate( function( obj, time ) {
            // Minute Handle
            const milliseconds = Date.now() - new Date().setMinutes(0,0,0)
            const handleAngle  = milliseconds * timewarp / 1000 / 60 / 60 % 1 // Hours since last Hour

            const fadeIn = fadeInSmooth(1000, 4500)(time)
            const distanceFade = ( 1 - mod( i / lineCount - handleAngle, 1 ) ) ** 10

            this.opacity( distanceFade * fadeIn )
        }).update()
    )
}
const hourLineCount = 12
for ( let i = 0; i < hourLineCount; i++ ) {
    handleLines.push(
        new SVGLine().mode("angle").center(50,50).radii(37,43).width(2).color( i % 3 ? "#888" : "#d11" ).angleNormalized( i / hourLineCount ).onUpdate( function( obj, time ) {
            // Second Handle
            const milliseconds = Date.now() - new Date().setSeconds(0,0)
            const handleAngle  = milliseconds * timewarp / 1000 / 60 / 60 / 12 % 1 // Days since Midnight

            const fadeIn = fadeInSmooth(1000, 4500)(time)
            const distanceFade = saturate( 1.75 - 1.75 * mod( i / hourLineCount - handleAngle, 1 ) ) ** 5

            this.opacity( distanceFade * fadeIn )
        }).update()
    )
}

for (const line of handleLines) globalSVG.appendChild(line.ele)
for (const handle of handles)   globalSVG.appendChild(handle.ele)

requestAnimationFrame(update = function(time) {
    for (const handle of handles)     handle.update(time)
    for (const line   of handleLines) line.update(time)
    requestAnimationFrame(update)
})

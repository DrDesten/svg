

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

class SGVElement {
    /** @param {string} type */
    constructor( ) {
        /* this.ele = document.createElementNS("http://www.w3.org/2000/svg", type)
        this.attributes = {} */
    }
    /** @param {string} attribute @param {string} value */
    set( attribute, value ) { return this.ele.setAttribute( attribute, value ), this.attributes[attribute] = value, this }

    // Animation ///////////////////////////////////////////////

    /** @param {(millisecondsSinceInitialisation: number)=>void} updateFunction */
    onUpdate( updateFunction ) {
        return this.applyUpdate = updateFunction, this
    }

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

}

class SVGArc  {
    constructor( opts = {} ) {
        this.ele = document.createElementNS("http://www.w3.org/2000/svg", "path")

        this.centerPosition = [0,0]
        this.startAngle     = 0
        this.endAngle       = 0
        this.circularRadius = 0

        this.attributes = {}

        const defaults = {
            "fill": "none",
            "stroke-width": "10",
            "stroke": "black",
            "stroke-linecap": "round",
        }
        opts = Object.assign(defaults, opts)
        for ( const opt in opts )
            this.ele.setAttribute(opt, opts[opt])
    }

    set() { return this.ele.setAttribute( ...arguments ), this }

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
        if ( this.applyUpdate != undefined ) this.applyUpdate.call(this, millisecondsSinceInitialisation)

        const center = { x: this.centerPosition[0], y: this.centerPosition[1] }
        const angles = { start: this.startAngle, end: this.endAngle }
        const radius = this.circularRadius

        // Calculate Start and End Positions using basic trigonometry
        let startPos = { x: Math.sin(angles.start) * radius + center.x, y: Math.cos(angles.start) * radius + center.y }
        let endPos   = { x: Math.sin(angles.end)   * radius + center.x, y: Math.cos(angles.end)   * radius + center.y}
        
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


    // Animation ///////////////////////////////////////////////

    /** @param {(millisecondsSinceInitialisation: number)=>void} updateFunction */
    onUpdate( updateFunction ) {
        this.applyUpdate = updateFunction
        return this
    }

    // Style ///////////////////////////////////////////////

    /** @param {string} cssColor */
    color( cssColor )  { this.ele.setAttribute("stroke", cssColor); return this }
    /** @param {number} width */
    width( width )     { this.ele.setAttribute("stroke-width", width); return this }
    /** @param {number} opacity */
    opacity( opacity ) { this.ele.setAttribute("opacity", opacity); return this }

}



svg = SVG( "#clock" )


const timewarp = 1
const handles = [
    new SVGArc().center(50,50).radius(40).color("#213").width(10).onUpdate( function(time) {
        // Hour Handle
        const milliseconds = Date.now() - new Date().setHours(0,0,0,0)
        const days         = milliseconds * timewarp / 1000 / 60 / 60 / 24 % 1 // Days since Midnight
        
        const fadeIn   = fadeInSmoothest(5500, 200)(time)
        const fadeWrap = smootheststep( days, (3600*24-5)/(3600*24), 1 ) * fadeIn
        const offset   = (fadeIn - 1)
        this.anglesNormalized(offset + fadeWrap * days, offset + fadeIn * days)
        
        this.opacity( fadeIn )
        //console.log("days", days)
    }).update(),
    new SVGArc().center(50,50).radius(30).color("#6de").width(8).onUpdate( function(time) {
        // Minute Handle
        const milliseconds = Date.now() - new Date().setMinutes(0,0,0)
        const hours        = milliseconds * timewarp / 1000 / 60 / 60 % 1// Hours since last Hour
        
        const fadeIn   = fadeInSmoother(4750, 200)(time)
        const fadeWrap = smootheststep( hours, 3595/3600, 1 ) * fadeIn
        const offset   = (fadeIn - 1)
        this.anglesNormalized(offset + fadeWrap * hours, offset + fadeIn * hours)
        
        this.opacity( fadeIn )
        //console.log("hours", hours)
    }).update(),
    new SVGArc().center(50,50).radius(22).color("#8fb").width(6).onUpdate( function(time) {
        // Second Handle
        const milliseconds = Date.now() - new Date().setSeconds(0,0)
        const minutes      = milliseconds * timewarp / 1000 / 60 % 1 // Minutes since last minute
        
        const fadeIn   = fadeInSmooth(4000, 0)(time)
        const fadeWrap = smootheststep( minutes, 55/60, 1 ) * fadeIn
        const offset   = (fadeIn - 1)
        this.anglesNormalized(offset + fadeWrap * minutes, offset + fadeIn * minutes)

        this.opacity( fadeIn )
        //console.log("minutes", minutes)
    }).update(),
]

//svg.appendChild(circle.ele)
for (const handle of handles) svg.appendChild(handle.ele)

console.log(handles)

requestAnimationFrame(update = function(time) {
    for (const handle of handles) handle.update(time)
    requestAnimationFrame(update)
})

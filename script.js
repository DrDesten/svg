/* const SVG = Object.assign(
    // Constructor Function /////////////////////////
    function( tag ) {
        if (tag == undefined) {
            this.ele = document.createElementNS("http://www.w3.org/2000/svg", "svg")
            this.ele.setAttribute("style", "width: 100%; height: 100%")
            return this
        }
        this.ele = document.createElementNS("http://www.w3.org/2000/svg", tag)
        return this
    },

    // Object Members ///////////////////////////////
    {
        addTo: function( querySelector ) {
            document.querySelector(querySelector).appendChild( this.ele )
            return this
        }
    }
) */

/* class SVG {
    constructor( tag ) {
        if (tag == undefined) {
            this.ele = document.createElementNS("http://www.w3.org/2000/svg", "svg")
            this.ele.setAttribute("style", "width: 100%; height: 100%")
            this.tag = "svg"
        } else {
            this.ele = document.createElementNS("http://www.w3.org/2000/svg", tag)
            this.tag = tag
        }
    }

    addTo( querySelector ) {
        document.querySelector( querySelector ).appendChild( this.ele )
        return this
    }

    add( ele ) {
        this.ele.appendChild( ele )
        return this
    }

} */

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


function SVGCircle() {
    return document.createElementNS("http://www.w3.org/2000/svg", "circle")
}

function Circle() { return {
    ele: document.createElementNS("http://www.w3.org/2000/svg", "circle"),
    set r( radius ) { this.ele.setAttribute("r", radius) },
    set fill( color ) { this.ele.setAttribute("fill", color) },
    set transform( opts ) { this.ele.setAttribute("transform", opts) },
}}


class SVGPath {
    constructor() {
        this.ele    = document.createElementNS("http://www.w3.org/2000/svg", "path")
        this.points = []
    }

    set() {
        this.ele.setAttribute( ...arguments )
        return this
    }

    /** @param {string} type @param {[number,number]} coordinates */
    addPoint( type, coordinates ) {
        if (this.points.length == 0) this.points.push(`M ${coordinates[0]} ${coordinates[1]}`)
        else this.points.push(`${type} ${coordinates[0]} ${coordinates[1]}`)
    }

    moveTo( x, y ) { this.addPoint("M", [x,y]); return this }
    lineTo( x, y ) { this.addPoint("L", [x,y]); return this }

    get element() {
        if (this.points.length) fthis.ele.setAttribute("d", this.points.join(" "))
        return this.ele
    }
}



class PathArc {
    constructor( opts = {} ) {
        this.ele = document.createElementNS("http://www.w3.org/2000/svg", "path")

        this.centerPosition = [0,0]
        this.startAngle     = 0
        this.endAngle       = 0
        this.circularRadius = 0

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
    setUpdate( updateFunction ) {
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


circle = Circle()
circle.fill = "gray"
circle.r = "5"
circle.transform = "translate(50,50)"

const arc = new PathArc()
arc.center(50, 50)
arc.radius(40)

const timewarp = 250
function fadeIn( fadeTime, startDelay = 0 ) {
    return function( time ) {
        time = Math.min(1,Math.max(0, (time - startDelay) / fadeTime))
        return (3 - 2 * time) * time * time
    }
}

const handles = [
    new PathArc().center(50,50).radius(40).color("#222").width(8).setUpdate( function(time) {
        // Hour Handle
        const fade = fadeIn(2000, 4000)(time)

        const milliseconds = Date.now() - new Date().setHours(0,0,0,0)
        const days         = milliseconds * timewarp / 1000 / 60 / 60 / 24 // Days since Midnight
        const offset       = (fade - 1) * Math.PI
        this.angles(offset, offset + days * Math.PI * 2)
        
        this.opacity( fade )
        //console.log("days", days)
    }).update(),
    new PathArc().center(50,50).radius(33).color("#fe8").width(4).setUpdate( function(time) {
        // Minute Handle
        const fade = fadeIn(2500, 3000)(time)

        const milliseconds = Date.now() - new Date().setMinutes(0,0,0)
        const hours        = milliseconds * timewarp / 1000 / 60 / 60 // Hours since last Hour
        const offset       = (fade - 1) * Math.PI
        this.angles(offset, offset + hours * Math.PI * 2)
        
        this.opacity( fade )
        //console.log("hours", hours)
    }).update(),
    new PathArc().center(50,50).radius(29).color("#ddd").width(2).setUpdate( function(time) {
        // Second Handle
        const fade = fadeIn(3000, 2000)(time)

        const milliseconds = Date.now() - new Date().setSeconds(0,0)
        const minutes      = milliseconds * timewarp / 1000 / 60 // Minutes since last minute
        const offset       = (fade - 1) * Math.PI
        this.angles(offset, offset + minutes * Math.PI * 2)

        this.opacity( fade )
        //console.log("minutes", minutes)
    }).update(),
]

svg.appendChild(circle.ele)
for (const handle of handles) svg.appendChild(handle.ele)

console.log(handles)

requestAnimationFrame(update = function(time) {
    for (const handle of handles) handle.update(time)
    requestAnimationFrame(update)
})

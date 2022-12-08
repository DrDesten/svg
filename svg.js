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
    
    // Style //////////////////////////////////////////////////
    
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


    ///////////////////////////////////////////////////////////////////
    // Static
    ///////////////////////////////////////////////////////////////////

    // Coordinate Maniputaion /////////////////////////////////

    /** 
     * Returns a point on a circle given an angle, radius and center  
     * @param {number} angle 
     * @param {number} radius 
     * @param {[number,number]|{x:number,y:number}} center 
     **/
    static circlePoint( angle, radius = 1, center = [0,0] ) {
        return { 
            x: Math.sin(angle) * radius + center[0] ?? center.x, 
            y: Math.cos(angle) * radius + center[1] ?? center.y,
            asArray: function() { return [ this.x, this.y ] }
        }
    }

    // Defaults //////////////////////////////////////////////

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

    /** @param {number} x @param {number=} y */
    center( x,y ) {
        this.centerPosition = [ x, y ?? x ]
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

        const angles = { start: this.startAngle, end: this.endAngle }
        const radius = this.circularRadius

        // Calculate Start and End Positions using basic trigonometry
        let startPos = SVGTemplate.circlePoint( this.startAngle, this.circularRadius, this.centerPosition )
        let endPos   = SVGTemplate.circlePoint( this.endAngle,   this.circularRadius, this.centerPosition )
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

    /** @param {number} x @param {number=} y */
    start( x,y ) { return this.pointMode.start = [x,y??x], this.set("x1", x).set("y1", y) }
    /** @param {number} x @param {number=} y */
    end( x,y )   { return this.pointMode.end = [x,y??x],   this.set("x2", x).set("y2", y) }

    /** @param {number} x @param {number=} y */
    center( x,y )    { return this.angleMode.center = [x,y??x], this }
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

            const startPos   = SVGTemplate.circlePoint( this.angleMode.angle, this.angleMode.startRadius, this.angleMode.center )
            const endPos     = SVGTemplate.circlePoint( this.angleMode.angle, this.angleMode.endRadius,   this.angleMode.center )

            return this.set("x1", startPos.x).set("y1", startPos.y)
                       .set("x2", endPos.x)  .set("y2", endPos.y)
        }
        
        throw new Error(`Mode '${this.coordinateMode}' not Recognized. Available Modes are: 'point', 'angle'`)
    }

}

class SVGGlobal {
    /**
     * Return a SVG, bound to a parent.  
     * Elements within it are relatively positioned [ 0 - 100 ]
     * @param {string} parentQuerySelector
     */
    constructor( parentQuerySelector ) {
        // Size in pixels of SVG
        const initSize = 100
    
        // Get parent via querySelector
        const parent = document.querySelector( parentQuerySelector )
        if (parent == null) throw new Error(`SVG(): Unable to bind parent. QuerySelector '${parentQuerySelector}' doesn't match a DOM element`)
    
        // Create SVG
        this.svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
        this.svg.setAttribute("style", `width: ${initSize}px; height: ${initSize}px`)
    
        // Change the SVG scale with the parent
        const resizeObserver = new ResizeObserver( entries => { 
            const entry = entries[0]
            const size  = [ entry.target.clientWidth, entry.target.clientHeight ]
            this.svg.style.transform = `translate(${(size[0]-initSize)/2}px,${(size[1]-initSize)/2}px) scale(${size[0]/100},-${size[1]/100})`
        })
        resizeObserver.observe(parent)
    
        // Add SVG to parent
        parent.appendChild( this.svg )
    }

    /** @param {SVGTemplate[]} SVGElements Adds new children to the SVG */
    add( ...SVGElements ) {
        for ( const ele of SVGElements ) this.svg.appendChild( ele.ele )
        return this
    }
}

const SVG = Object.assign( 
    SVGGlobal, {
    line: SVGLine,
    arc: SVGArc
})
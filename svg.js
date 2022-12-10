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

    /** @returns {Object.<string,string>} */
    static get fillDefaults() { return {
        "fill": "black",
        "stroke-width": "10",
        "stroke": "none",
        "stroke-linecap": "round",
    }}
}

class SVGArc extends SVGTemplate {
    /** @param {Object.<string,string>} opts */
    constructor( opts = {} ) {
        super( "path" )
        this.setDefaults(SVGTemplate.lineDefaults, opts)

        this.centerPosition = [0,0]
        this.startAngle = 0
        this.endAngle = 0
        this.circularRadius = 0
    }

    /** 
     * Sets the center position of the arc.
     * @param {number} x - The x coordinate of the center.
     * @param {number=} y - The y coordinate of the center. If not provided, the x coordinate is used for both x and y.
     */
    center( x,y ) {
        this.centerPosition = [ x, y ?? x ]
        return this
    }

    /** 
     * Sets the start and end angles of the arc.
     * @param {number} startAngle - The starting angle of the arc, in radians.
     * @param {number} endAngle - The ending angle of the arc, in radians.
     */
    angles( startAngle, endAngle ) {
        this.startAngle = startAngle
        this.endAngle = endAngle
        return this
    }

    /** 
     * Sets the start and end angles of the arc, given as values between 0 and 1.
     * @param {number} startAngle - The starting angle of the arc, as a value between 0 and 1.
     * @param {number} endAngle - The ending angle of the arc, as a value between 0 and 1.
     */
    anglesNormalized( startAngle, endAngle ) {
        this.startAngle = startAngle * Math.PI * 2
        this.endAngle = endAngle * Math.PI * 2
        return this
    }

    /** 
     * Sets the radius of the circular arc.
     * @param {number} radius - The radius of the circular arc.
     */
    radius( radius ) {
        this.circularRadius = radius
        return this
    }

    /** 
     * Updates the arc to reflect any changes to its properties.
     * @param {number} millisecondsSinceInitialisation - The number of milliseconds since the object was initialized. 
     */
    update( millisecondsSinceInitialisation = Infinity ) {
        // If an update callback function has been set, call it.
        if ( this.updateCallback != undefined ) this.updateCallback.call(this, this, millisecondsSinceInitialisation)

        // Store the start and end angles in an object.
        const angles = { start: this.startAngle, end: this.endAngle }
        // Store the circular radius in a variable.
        const radius = this.circularRadius

        // Calculate the start and end positions using basic trigonometry.
        let startPos = SVGTemplate.circlePoint( this.startAngle, this.circularRadius, this.centerPosition )
        let endPos = SVGTemplate.circlePoint( this.endAngle, this.circularRadius, this.centerPosition )
        // Prevent flicker when the start and end positions are almost the same.
        if ( Math.abs(startPos.x - endPos.x) < 0.0001 ) startPos.x += 0.0001
        if ( Math.abs(startPos.y - endPos.y) < 0.0001 ) startPos.y += 0.0001

        // Calculate the angular length of the arc.
        let angularLength = (angles.end - angles.start) / ( Math.PI * 2 ) % 1

        // Initialize the "path" string that will be used to define the SVG path element.
        let path = ""
        // Set the rotation of the arc.
        path += `M ${startPos.x} ${startPos.y} `
        // Define the start of the arc.
        path += `A ${radius} ${radius} `
        // Set the ellipse rotation to 0.
        path += `0 `
        // Set the angle flag to true (1) if the angular length is larger than 180 degrees.
        path += `${+((angularLength > -0.5 && angularLength < 0) || (angularLength > 0.5 && angularLength < 1))} `
        // Set the sweep flag to 0.
        path += `0 `
        // Set the end position of the arc.
        path += `${endPos.x} ${endPos.y}`

        // Set the "d" attribute of the SVG path element to the "path" string.
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
        
        throw new Error(`Positioning mode '${this.coordinateMode}' not recognized. Available modes are: 'point', 'angle'`)
    }

}

// Made by ChatGPT
class SVGCircle extends SVGTemplate {
    /** @param {Object.<string,string>} opts */
    constructor( opts = {} ) {
        super( "circle" )
        this.setDefaults(SVGTemplate.fillDefaults, opts)

        this.centerPosition = [0,0]
        this.circularRadius = 0
    }

    /** 
     * Sets the center position of the circle.
     * @param {number} x - The x coordinate of the center.
     * @param {number=} y - The y coordinate of the center. If not provided, the x coordinate is used for both x and y.
     */
    center( x, y ) { return this.centerPosition = [x, y ?? x], this }
    /** 
     * Sets the radius of the circle.
     * @param {number} r - The radius of the circle.
     */
    radius( r ) { return this.circularRadius = r, this }

    /** 
     * Updates the circle to reflect any changes to its properties.
     * @param {number} millisecondsSinceInitialisation - The number of milliseconds since the object was initialized. 
     */
    update( millisecondsSinceInitialisation = Infinity ) {
        // If an update callback function has been set, call it.
        if ( this.updateCallback != undefined ) this.updateCallback.call(this, this, millisecondsSinceInitialisation)

        // Update the SVG circle element to reflect the current center and radius values.
        this.set("cx", this.centerPosition[0]).set("cy", this.centerPosition[1]).set("r", this.circularRadius)
        return this
    }
}

// Made by ChatGPT
class SVGRect extends SVGTemplate {
    /** @param {Object.<string,string>} opts */
    constructor( opts = {} ) {
        super( "rect" )
        this.setDefaults(SVGTemplate.fillDefaults, opts)
        
        this.coordinateMode = "corner"
        this.rectangleDimensions = [0,0]
        this.rectanglePosition = [0,0]
        this.borderRadii = [0,0]
    }

    /**
     * Sets the coordinate mode for the rectangle.
     * @param {"center"|"corner"} coordinateMode - The coordinate mode to use. Possible values are "center" and "corner".
     */
    mode( coordinateMode ) { return this.coordinateMode = coordinateMode, this }

    /**
     * Sets the dimensions of the rectangle.
     * @param {number} width - The width of the rectangle.
     * @param {number=} height - The height of the rectangle. If not provided, the width is used for both width and height.
     */
    dimensions( width, height ) { return this.rectangleDimensions = [width,height??width], this }

    /**
     * Sets the position of the rectangle.
     * @param {number} x - The x coordinate of the rectangle.
     * @param {number=} y - The y coordinate of the rectangle. If not provided, the x coordinate is used for both x and y.
     */
    position( x, y ) { return this.rectanglePosition = [x,y??x], this }

    /**
     * Sets the border radii of the rectangle.
     * @param {number} rx - The x coordinate of the border radius.
     * @param {number=} ry - The y coordinate of the border radius. If not provided, the x coordinate is used for both x and y.
     */
    radius( rx, ry ) { return this.borderRadii = [rx,ry??rx], this }

    /** 
     * Updates the rectangle to reflect any changes to its properties.
     * @param {number} millisecondsSinceInitialisation - The number of milliseconds since the object was initialized. 
     */
    update( millisecondsSinceInitialisation = Infinity ) {
        // If an update callback function has been set, call it.
        if ( this.updateCallback != undefined ) this.updateCallback.call(this, this, millisecondsSinceInitialisation)
        
        if ( this.coordinateMode == "center" ) {

            // If the coordinate mode is "center", calculate the rectangle position based on its dimensions and the center position.
            const [width,height] = this.rectangleDimensions
            const [x,y] = this.rectanglePosition
            this.set("x", x - width/2)
                .set("y", y - height/2)
                .set("width", width)
                .set("height", height)
                .set("rx", this.borderRadii[0])
                .set("ry", this.borderRadii[1])

        } else if ( this.coordinateMode == "corner" ) {

            // If the coordinate mode is "corner", use the rectangle dimensions and position as-is.
            const [width,height] = this.rectangleDimensions
            const [x,y] = this.rectanglePosition
            this.set("x", x)
                .set("y", y)
                .set("width", width)
                .set("height", height)
                .set("rx", this.borderRadii[0])
                .set("ry", this.borderRadii[1])

        } else {
            // If the coordinate mode is not recognized, throw an error.
            throw new Error(`Positioning mode '${this.coordinateMode}' not recognized. Available modes are: 'center', 'corner'`)
        }
        
        return this
    }
}



class SVGGlobal {
    /**
     * Returns a new SVG element, bound to a parent element specified by a query selector.
     * The SVG element will take up the entire size of the parent element, with its elements positioned relatively within a [0, 100] range.
     * @param {string} parentQuerySelector - The query selector used to find the parent element for the SVG image.
     */
    constructor( parentQuerySelector ) {
        // The initial size of the SVG element in pixels.
        const initSize = 100

        // Get the parent element using the provided query selector.
        const parent = document.querySelector( parentQuerySelector )
        if (parent == null) {
            throw new Error(`SVG(): Unable to bind parent. Query selector '${parentQuerySelector}' does not match a DOM element.`)
        }

        // Create the SVG element.
        this.svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
        this.svg.setAttribute("style", `width: ${initSize}px; height: ${initSize}px`)

        // Change the SVG scale with the parent element size.
        const resizeObserver = new ResizeObserver( entries => {
            // Get the size of the parent element.
            const entry = entries[0]
            const size = [ entry.target.clientWidth, entry.target.clientHeight ]

            // Scale the SVG element according to the parent size.
            this.svg.style.transform = `translate(${(size[0]-initSize)/2}px,${(size[1]-initSize)/2}px) scale(${size[0]/100},-${size[1]/100})`
        })
        resizeObserver.observe(parent)

        // Add the SVG element to the parent element.
        parent.appendChild( this.svg )
    }

    /** 
     * Adds new children to the SVG element.
     * @param {SVGTemplate[]} SVGElements - The elements to be added as children of the SVG image.
     */
    add( ...SVGElements ) {
        for ( const ele of SVGElements )
            this.svg.appendChild( ele.ele )
        return this
    }
}


const SVG = Object.assign( 
    SVGGlobal, {
    line: SVGLine,
    arc: SVGArc
})
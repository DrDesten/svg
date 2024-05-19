export { vec2, vec3, vec4 } from "./jvec/bin/vec.js"
import { vec2 } from "./jvec/bin/vec.js"

const Defaults = {
    line: {
        "fill": "none",
        "stroke-width": "10",
        "stroke": "black",
        "stroke-linecap": "round",
    },
    fill: {
        "fill": "black",
        "stroke-width": "10",
        "stroke": "none",
        "stroke-linecap": "round",
    },
    text: {
        "style": "font: 10px sans-serif"
    }
}

class SVGTemplate {
    /** @param {string} type */
    constructor( type ) {
        this.ele = document.createElementNS( "http://www.w3.org/2000/svg", type )

        /** @type {Object.<string,string>} */
        this.attributes = {}
        /** @type {Object.<string,(string|number)[]>} */
        this.transformAttributes = {}
    }
    /** @param {string} attribute @param {string} value */
    set( attribute, value ) { return this.ele.setAttribute( attribute, value ), this.attributes[attribute] = value, this }
    /** @param {string} attribute */
    unset( attribute ) { return this.ele.removeAttribute( attribute ), this }

    /** @param {Object.<string,string>} defaults @param {Object.<string,string>} override */
    setDefaults( defaults, override ) {
        const attributes = Object.assign( defaults, override )
        for ( const attribute in attributes ) this.set( attribute, attributes[attribute] )
    }

    // Animation ///////////////////////////////////////////////

    /** @param {number} millisecondsSinceInitialisation */
    update( millisecondsSinceInitialisation = Infinity ) {
        if ( this.updateCallback != undefined ) this.updateCallback.call( this, this, millisecondsSinceInitialisation )
        return this
    }

    /** @param {(SVGObject: this, millisecondsSinceInitialisation: number)=>void} updateFunction */
    onUpdate( updateFunction ) { return this.updateCallback = updateFunction, this }

    // Style //////////////////////////////////////////////////

    /** @param {string} cssColor */
    fill( cssColor ) { return this.set( "fill", cssColor ), this }
    /** @param {string} cssColor */
    color( cssColor ) { return this.set( "stroke", cssColor ), this }

    /** @param {number} width */
    width( width ) { return this.set( "stroke-width", width ), this }
    /** @param {string} linecap */
    linecap( linecap ) { return this.set( "stroke-linecap", linecap ), this }

    /** @param {number} opacity */
    opacity( opacity ) { return this.set( "opacity", opacity ), this }

    applyTransforms() {
        let transformProperty = ""
        for ( const transform in this.transformAttributes ) {
            transformProperty += ` ${transform}(${this.transformAttributes[transform].join( "," )}) `
        }
        this.set( "transform", transformProperty )
        return this
    }

    scale( x, y ) {
        this.transformAttributes.scale = [x, y ?? x]
        this.applyTransforms()
        return this
    }

    rotate( angle ) {
        this.transformAttributes.rotate = [angle]
        return this.applyTransforms()
    }

    ///////////////////////////////////////////////////////////////////
    // Static
    ///////////////////////////////////////////////////////////////////

    // Coordinate Maniputaion ///////////////////////////////

    /** 
     * Returns a point on a circle given an angle, radius and center  
     * @param {number} angle 
     * @param {number} radius 
     * @param {vec2} center 
     **/
    static circlePoint( angle, radius = 1, center = new vec2 ) {
        return vec2.fromAngle( angle ).mul( radius ).add( center )
    }

    // Curves ////////////////////////////////////////////////

    static get cubicBezier() {
        return {

            /**
             * Calculates the control point for a cubic Bezier curve.
             * @param {vec2} lastlast The previous point before the last point.
             * @param {vec2} last The last point.
             * @param {vec2} current The current point.
             * @param {number=} guideDistance The distance that the control point should be from the last point. If not specified, the distance is calculated from the last and current points.
             * @returns {{point: vec2, guideVector: vec2}} An object containing the calculated control point and the guide vector used to calculate it.
            */
            controlPoint1( lastlast, last, current, guideDistance ) {
                guideDistance ??= vec2.distance( last, current )
                const guideVector = current.clone().sub( lastlast ).setLength( guideDistance / 3 )
                const controlPoint = last.clone().add( guideVector )
                return {
                    point: controlPoint,
                    guideVector: guideVector
                }
            },

            /**
             * Calculates the control point for a cubic Bezier curve.
             * @param {vec2} last The last point.
             * @param {vec2} current The current point.
             * @param {vec2} next The next point.
             * @param {number=} guideDistance The distance that the control point should be from the last point. If not specified, the distance is calculated from the last and current points.
             * @returns {{point: vec2, guideVector: vec2}} An object containing the calculated control point and the guide vector used to calculate it.
            */
            controlPoint2( last, current, next, guideDistance ) {
                guideDistance ??= vec2.distance( last, current )
                const guideVector = last.clone().sub( next ).setLength( guideDistance / 3 )
                const controlPoint = current.clone().add( guideVector )
                return {
                    point: controlPoint,
                    guideVector: guideVector
                }
            },

            /**
             * Calculates the control points for a cubic Bezier curve.
             * @param {vec2=} lastlast The previous point before the last point.
             * @param {vec2}  last The last point.
             * @param {vec2}  current The current point.
             * @param {vec2=} next The next point.
             * @param {number=} guideDistance The distance that the control point should be from the last point. If not specified, the distance is calculated from the last and current points.
             * @returns {[
             *      {point: vec2, guideVector: vec2},
             *      {point: vec2, guideVector: vec2}
             * ]} An array containing the two calculated control points and their corresponding guide vectors.
            */
            controlPoints( lastlast, last, current, next, guideDistance ) {
                if ( !last || !current ) throw new Error( "SVGTemplate.cubicBezier.controlPoints(): 'last' or 'current' are undefined. Both are required to calculate control points" )
                if ( !lastlast && !next ) throw new Error( "SVGTemplate.cubicBezier.controlPoints(): 'lastlast' and 'next' are undefined. At least one is required to calculate control points" )

                guideDistance ??= vec2.distance( last, current )

                if ( lastlast && next ) { // Both are defined, simply calculate control points
                    return [
                        this.controlPoint1( lastlast, last, current, guideDistance ),
                        this.controlPoint2( last, current, next, guideDistance ),
                    ]
                }

                if ( next ) { // 'lastlast' is not defined
                    const cp2 = this.controlPoint2( last, current, next, guideDistance )
                    const cp1 = {
                        point: cp2.guideVector.clone().mul( 1.5 ).add( current ).sub( last ).div( 3 ).add( last ),
                        guideVector: undefined
                    }
                    return [cp1, cp2]
                }

                if ( lastlast ) { // 'next' is not defined
                    const cp1 = this.controlPoint1( lastlast, last, current, guideDistance )
                    const cp2 = {
                        point: cp1.guideVector.clone().mul( 1.5 ).add( last ).sub( current ).div( 3 ).add( current ),
                        guideVector: undefined
                    }
                    return [cp1, cp2]
                }

                throw new Error( "SVGTeplate.cubicBezier.controlPoints(): What the actual fuck?" )

            },

        }
    }
}

class SVGArc extends SVGTemplate {
    /** @param {Object.<string,string>} opts */
    constructor( opts = {} ) {
        super( "path" )
        this.setDefaults( Defaults.line, opts )

        /** @private */
        this.centerPosition = new vec2
        /** @private */
        this.startAngle = 0
        /** @private */
        this.endAngle = 0
        /** @private */
        this.circularRadius = 0
    }

    /** 
     * Sets the center position of the arc.
     * @param {number} x - The x coordinate of the center.
     * @param {number=} y - The y coordinate of the center. If not provided, the x coordinate is used for both x and y.
     */
    center( x, y ) {
        this.centerPosition = new vec2( x, y ?? x )
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
        if ( this.updateCallback != undefined ) this.updateCallback.call( this, this, millisecondsSinceInitialisation )

        // Store the start and end angles in an object.
        const angles = { start: this.startAngle, end: this.endAngle }
        // Store the circular radius in a variable.
        const radius = this.circularRadius

        // Calculate the start and end positions using basic trigonometry.
        let startPos = SVGTemplate.circlePoint( this.startAngle, this.circularRadius, this.centerPosition )
        let endPos = SVGTemplate.circlePoint( this.endAngle, this.circularRadius, this.centerPosition )
        // Prevent flicker when the start and end positions are almost the same.
        if ( Math.abs( startPos.x - endPos.x ) < 0.0001 ) startPos.x += 0.0001
        if ( Math.abs( startPos.y - endPos.y ) < 0.0001 ) startPos.y += 0.0001

        // Calculate the angular length of the arc.
        let angularLength = ( angles.end - angles.start ) / ( Math.PI * 2 ) % 1

        // Initialize the "path" string that will be used to define the SVG path element.
        let path = ""
        // Set the rotation of the arc.
        path += `M ${startPos.x} ${startPos.y} `
        // Define the start of the arc.
        path += `A ${radius} ${radius} `
        // Set the ellipse rotation to 0.
        path += `0 `
        // Set the angle flag to true (1) if the angular length is larger than 180 degrees.
        path += `${+!( ( angularLength > -0.5 && angularLength < 0 ) || ( angularLength > 0.5 && angularLength < 1 ) )} `
        // Set the sweep flag to 0.
        path += `0 `
        // Set the end position of the arc.
        path += `${endPos.x} ${endPos.y}`

        // Set the "d" attribute of the SVG path element to the "path" string.
        this.set( "d", path )
        return this
    }

}

class PathPoint extends vec2 {
    /**
     * @param {'line'|'cubic bezier'|'quadratic bezier'|'close'|'custom'} type 
     * @param {number} x 
     * @param {number} y 
     * @param {string=} custom 
     */
    constructor( type, x, y, custom ) {
        super( x, y )
        this.type = type
        if ( this.type === "custom" ) {
            this.custom = custom
        }
    }
}

class SVGPath extends SVGTemplate {
    /** @param {Object.<string,string>} opts */
    constructor( opts = {} ) {
        super( "path" )
        this.setDefaults( Defaults.line, opts )

        /** @private @type {'line'|'cubic bezier'|'quadratic bezier'|'custom'} */
        this.pathMode = "line"
        /** @private @type {PathPoint[]} */
        this.pathPoints = []
        /** @private @type {boolean} */
        this.closed = false
    }

    /**
     * Sets the path mode, which determines how subsequent points in the path will be connected.
     * @param {'line'|'bezier'|'cubic bezier'|'quadratic bezier'|'custom'} mode - The path mode to set.
     */
    mode( mode ) {
        return this.pathMode = {
            "L": "line",
            "line": "line",

            "C": "cubic bezier",
            "S": "cubic bezier",
            "bezier": "cubic bezier",
            "cubic bezier": "cubic bezier",

            "Q": "quadratic bezier",
            "T": "quadratic bezier",
            "quadratic bezier": "quadratic bezier",

            "custom": "custom",
        }[mode], this
    }

    /** 
     * Adds a point to the path.
     * @param {number|string} x - The x coordinate of the point, or a custom string when mode has been set to "custom"
     * @param {number=} y - The y coordinate of the point. If not provided, the x coordinate is used for both x and y.
     */
    point( x, y ) {
        this.pathPoints.push(
            this.pathMode == "custom" ?
                new PathPoint( this.pathMode, NaN, NaN, x ) :
                new PathPoint( this.pathMode, x, y ?? x )
        )
        return this
    }

    /**
     * Closes the path.
     */
    close() {
        this.pathPoints.push( new PathPoint( "close", this.pathPoints[0]?.x, this.pathPoints[0]?.y ) )
        this.closed = true
        return this
    }

    // Animation ///////////////////////////////////////////////

    /** 
     * Updates the path.
     * @param {number} millisecondsSinceInitialisation - The number of milliseconds that have elapsed since the path was initialized.
     */
    update( millisecondsSinceInitialisation = Infinity ) {
        if ( this.updateCallback != undefined ) this.updateCallback.call( this, this, millisecondsSinceInitialisation )

        let path = ""
        for ( const [i, point] of this.pathPoints.entries() ) {

            if ( i == 0 ) {
                path += `M ${point.x} ${point.y} `
                continue
            }

            if ( point.type == "close" ) {
                const lastPoint = this.pathPoints[i - 1]
                if ( lastPoint.type != "cubic bezier" ) {
                    path += "Z "
                } else {
                    const points = {
                        // Set next point to be the first to close the path smoothly
                        "-2": this.pathPoints[i - 2], // Undefined only when Path is a single point
                        "-1": this.pathPoints[i - 1], // Always available
                        "0": this.pathPoints[0],   // Always available
                        "1": this.pathPoints[1],   // Always available
                    }
                    const controlPoints = SVGTemplate.cubicBezier.controlPoints( points[-2], points[-1], points[0], points[1] )
                    path += `C ${controlPoints[0].point.x} ${controlPoints[0].point.y} ${controlPoints[1].point.x} ${controlPoints[1].point.y} ${point.x} ${point.y} Z `
                }
                break
            }

            switch ( point.type ) {
                case "line":
                    path += `L ${point.x} ${point.y} `
                    break
                case "cubic bezier":
                    const points = {
                        // If the path is closed and this is the first curve, use last point as previous to first
                        // last point is at index '-2' since the 'close' tag is in the last place
                        "-2": this.closed && i == 1 ? this.pathPoints[this.pathPoints.length - 2] : this.pathPoints[i - 2], // May be undefined 
                        "-1": this.pathPoints[i - 1], // Always available
                        "0": this.pathPoints[i],   // Always available
                        "1": this.pathPoints[i + 1], // May be undefined
                    }

                    // Only two available points, draw a line
                    if ( !( points[-2] || points[1] ) ) {
                        path += `L ${point.x} ${point.y} `
                        break
                    }

                    const controlPoints = SVGTemplate.cubicBezier.controlPoints( points[-2], points[-1], points[0], points[1] )

                    path += `C ${controlPoints[0].point.x} ${controlPoints[0].point.y} `
                        + `${controlPoints[1].point.x} ${controlPoints[1].point.y} `
                        + `${point.x} ${point.y} `
                    break
                case "quadratic bezier":
                    path += `T ${point.x} ${point.y} `
                    break
                case "custom":
                    path += ` ${point.custom} `
                    break
                default:
                    throw new Error( `SVGPath.update(): Unexpected Point Type '${point.type}'` )
            }

        }

        this.set( "d", path )
        return this
    }
}


class SVGLine extends SVGTemplate {
    /** @param {Object.<string,string>} opts */
    constructor( opts = {} ) {
        super( "line" )
        this.setDefaults( Defaults.line, opts )

        /** @private */
        this.coordinateMode = "point"
        /** @private */
        this.angleMode = {
            center: new vec2,
            angle: 0,
            startRadius: 0,
            endRadius: 0,
        }
        /** @private */
        this.pointMode = {
            start: new vec2,
            end: new vec2,
        }
    }

    /** @param {"point"|"angle"} coordinateMode */
    mode( coordinateMode ) { return this.coordinateMode = coordinateMode, this }

    /** @param {number} x @param {number=} y */
    start( x, y ) { return this.pointMode.start = new vec2( x, y ?? x ), this.set( "x1", x ).set( "y1", y ) }
    /** @param {number} x @param {number=} y */
    end( x, y ) { return this.pointMode.end = new vec2( x, y ?? x ), this.set( "x2", x ).set( "y2", y ) }

    /** @param {number} x @param {number=} y */
    center( x, y ) { return this.angleMode.center = new vec2( x, y ?? x ), this }
    /** @param {number} a */
    angle( a ) { return this.angleMode.angle = a, this }
    /** @param {number} a */
    angleNormalized( a ) { return this.angleMode.angle = a * Math.PI * 2, this }
    /** @param {number} r */
    startRadius( r ) { return this.angleMode.startRadius = r, this }
    /** @param {number} r */
    endRadius( r ) { return this.angleMode.endRadius = r, this }
    /** @param {number} startRadius @param {number} endRadius */
    radii( startRadius, endRadius ) { return this.startRadius( startRadius ).endRadius( endRadius ) }

    // Animation //////////////////////////////////////////

    /** @param {number} millisecondsSinceInitialisation */
    update( millisecondsSinceInitialisation = Infinity ) {
        if ( this.updateCallback != undefined ) this.updateCallback.call( this, this, millisecondsSinceInitialisation )
        if ( this.coordinateMode == "point" )
            return this.set( "x1", this.pointMode.start.x ).set( "y1", this.pointMode.start.y )
                .set( "x2", this.pointMode.end.x ).set( "y2", this.pointMode.end.y )

        if ( this.coordinateMode == "angle" ) {

            const startPos = SVGTemplate.circlePoint( this.angleMode.angle, this.angleMode.startRadius, this.angleMode.center )
            const endPos = SVGTemplate.circlePoint( this.angleMode.angle, this.angleMode.endRadius, this.angleMode.center )

            return this.set( "x1", startPos.x ).set( "y1", startPos.y )
                .set( "x2", endPos.x ).set( "y2", endPos.y )
        }

        throw new Error( `Positioning mode '${this.coordinateMode}' not recognized. Available modes are: 'point', 'angle'` )
    }

}

class SVGCircle extends SVGTemplate {
    /** @param {Object.<string,string>} opts */
    constructor( opts = {} ) {
        super( "circle" )
        this.setDefaults( Defaults.fill, opts )

        /** @private */
        this.centerPosition = new vec2
        /** @private */
        this.circularRadius = 0
    }

    /** 
     * Sets the center position of the circle.
     * @param {number} x - The x coordinate of the center.
     * @param {number=} y - The y coordinate of the center. If not provided, the x coordinate is used for both x and y.
     */
    center( x, y ) { return this.centerPosition = new vec2( x, y ?? x ), this }
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
        if ( this.updateCallback != undefined ) this.updateCallback.call( this, this, millisecondsSinceInitialisation )

        // Update the SVG circle element to reflect the current center and radius values.
        this.set( "cx", this.centerPosition.x ).set( "cy", this.centerPosition.y ).set( "r", this.circularRadius )
        return this
    }
}

class SVGEllipse extends SVGTemplate {
    /** @param {Object.<string,string>} opts */
    constructor( opts = {} ) {
        super( "ellipse" )
        this.setDefaults( Defaults.fill, opts )

        /** @private */
        this.centerPosition = new vec2
        /** @private */
        this.ellipseRadii = new vec2
    }

    /** 
     * Sets the center position of the circle.
     * @param {number} x - The x coordinate of the center.
     * @param {number=} y - The y coordinate of the center. If not provided, the x coordinate is used for both x and y.
     */
    center( x, y ) { return this.centerPosition = new vec2( x, y ?? x ), this }
    /** 
     * Sets the radius of the circle.
     * @param {number} rx - The x-radius of the ellipse.
     * @param {number=} ry - The y-radius of the ellipse. If not provided, the x-radius is used for both x and y.
     */
    radius( rx, ry ) { return this.ellipseRadii = new vec2( rx, ry ?? rx ), this }

    /** 
     * Updates the circle to reflect any changes to its properties.
     * @param {number} millisecondsSinceInitialisation - The number of milliseconds since the object was initialized. 
     */
    update( millisecondsSinceInitialisation = Infinity ) {
        // If an update callback function has been set, call it.
        if ( this.updateCallback != undefined ) this.updateCallback.call( this, this, millisecondsSinceInitialisation )

        // Update the SVG ellipse element to reflect the current center and radius values.
        this.set( "cx", this.centerPosition.x )
            .set( "cy", this.centerPosition.y )
            .set( "rx", this.ellipseRadii.x )
            .set( "ry", this.ellipseRadii.y )
        return this
    }
}

class SVGRectangle extends SVGTemplate {
    /** @param {Object.<string,string>} opts */
    constructor( opts = {} ) {
        super( "rect" )
        this.setDefaults( Defaults.fill, opts )

        /** @private */
        this.coordinateMode = "corner"
        /** @private */
        this.rectangleDimensions = new vec2
        /** @private */
        this.rectanglePosition = new vec2
        /** @private */
        this.borderRadii = new vec2
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
    dimensions( width, height ) { return this.rectangleDimensions = new vec2( width, height ?? width ), this }

    /**
     * Sets the position of the rectangle.
     * @param {number} x - The x coordinate of the rectangle.
     * @param {number=} y - The y coordinate of the rectangle. If not provided, the x coordinate is used for both x and y.
     */
    position( x, y ) { return this.rectanglePosition = new vec2( x, y ?? x ), this }

    /**
     * Sets the border radii of the rectangle.
     * @param {number} rx - The x coordinate of the border radius.
     * @param {number=} ry - The y coordinate of the border radius. If not provided, the x coordinate is used for both x and y.
     */
    radius( rx, ry ) { return this.borderRadii = new vec2( rx, ry ?? rx ), this }

    /** 
     * Updates the rectangle to reflect any changes to its properties.
     * @param {number} millisecondsSinceInitialisation - The number of milliseconds since the object was initialized. 
     */
    update( millisecondsSinceInitialisation = Infinity ) {
        // If an update callback function has been set, call it.
        if ( this.updateCallback != undefined ) this.updateCallback.call( this, this, millisecondsSinceInitialisation )

        if ( this.coordinateMode == "center" ) {

            // If the coordinate mode is "center", calculate the rectangle position based on its dimensions and the center position.
            const [width, height] = this.rectangleDimensions
            const [x, y] = this.rectanglePosition
            this.set( "x", x - width / 2 )
                .set( "y", y - height / 2 )
                .set( "width", width )
                .set( "height", height )
                .set( "rx", this.borderRadii.x )
                .set( "ry", this.borderRadii.y )

        } else if ( this.coordinateMode == "corner" ) {

            // If the coordinate mode is "corner", use the rectangle dimensions and position as-is.
            const [width, height] = this.rectangleDimensions
            const [x, y] = this.rectanglePosition
            this.set( "x", x )
                .set( "y", y )
                .set( "width", width )
                .set( "height", height )
                .set( "rx", this.borderRadii.x )
                .set( "ry", this.borderRadii.y )

        } else {
            // If the coordinate mode is not recognized, throw an error.
            throw new Error( `Positioning mode '${this.coordinateMode}' not recognized. Available modes are: 'center', 'corner'` )
        }

        return this
    }
}

class SVGText extends SVGTemplate {
    /** @param {Object.<string,string>} opts */
    constructor( opts = {} ) {
        super( "text" )
        this.setDefaults( Defaults.text, opts )

        /** @private */
        this.string = ""
        /** @private */
        this.textPos = new vec2
        /** @private */
        this.textLengthAdjust = "spacing"
        /** @private */
        this.textLength = ""
    }

    /**
     * Sets the text to display.
     * @param {string} text - The text to display.
     */
    text( text ) { return this.string = text, this }

    /**
     * Sets the position of the text.
     * @param {number} x - The x coordinate of the text.
     * @param {number=} y - The y coordinate of the text. If not provided, the x coordinate is used for both x and y.
     */
    pos( x, y ) { return this.textPos = new vec2( x, y ?? x ), this }

    /**
     * Sets the length adjustment of the text.
     * @param {"spacing"|"spacingAndGlyphs"|"none"} lengthAdjust - The length adjustment to use. Possible values are "spacing", "spacingAndGlyphs", and "none".
     */
    lengthAdjust( lengthAdjust ) { return this.textLengthAdjust = lengthAdjust, this }

    /**
     * Sets the length of the text.
     * @param {"length"|"ideographic"|"discretionary"|"none"} length - The length to use. Possible values are "length", "ideographic", "discretionary", and "none".
     */
    length( length ) { return this.textLength = length, this }

    /**
     * Updates the text to reflect any changes to its properties.
     * @param {number} millisecondsSinceInitialisation - The number of milliseconds since the object was initialized.
     */
    update( millisecondsSinceInitialisation = Infinity ) {
        // If an update callback function has been set, call it.
        if ( this.updateCallback != undefined ) this.updateCallback.call( this, this, millisecondsSinceInitialisation )
        // Update the SVG text element to reflect the current text value.
        this.set( "x", this.textPos.x )
            .set( "y", this.textPos.y )
            .set( "lengthAdjust", this.textLengthAdjust )
        if ( this.textLength ) this.set( "textLength", this.textLength )
        else this.unset( "textLength" )
        this.ele.innerHTML = this.string
    }
}

class SVGGroup extends SVGTemplate {
    /** @param {Object.<string,string>} opts */
    constructor( opts = {} ) {
        super( "g" )
        this.setDefaults( {}, opts )
        this.children = []
    }

    /** 
     * Updates the rectangle to reflect any changes to its properties.
     * @param {number} millisecondsSinceInitialisation - The number of milliseconds since the object was initialized. 
     */
    update( millisecondsSinceInitialisation = Infinity ) {
        // If an update callback function has been set, call it.
        if ( this.updateCallback != undefined ) this.updateCallback.call( this, this, millisecondsSinceInitialisation )
        // Update the SVG group element to reflect the current children.
        this.children.forEach( child => child.update( millisecondsSinceInitialisation ) )
        return this
    }

    /** 
     * Adds new children to the SVG group.
     * @param {SVGTemplate[]} SVGElements - The elements to be added as children of the SVG image.
     */
    add( ...SVGElements ) {
        for ( const ele of SVGElements ) {
            this.children.push( ele )
            this.ele.appendChild( ele.ele )
        }
        return this
    }
}

class SVGGlobal {
    /**
     * Returns a new SVG element, bound to a parent element specified by a query selector.
     * The SVG element will take up the entire size of the parent element, with its elements positioned relatively within a [0, 100] range.
     * @param {string|HTMLElement} parent - The query selector used to find the parent element for the SVG image or an HTML element.
     * @param {"stretch"|"cover"|"fit"|"fixed"} fitMode - The query selector used to find the parent element for the SVG image.
     */
    constructor( parent, fitMode = "stretch" ) {

        if ( typeof parent === "string" ) {

            this.parent = document.querySelector( parent )
            if ( this.parent == null ) {
                throw new Error( `SVG(): Unable to bind parent. Query selector '${parent}' does not match a DOM element.` )
            }

        } else {
            this.parent = parent
        }

        this.svg = document.createElementNS( "http://www.w3.org/2000/svg", "svg" )

        switch ( fitMode ) {
            case undefined:
            case "stretch":
                this.parentAttachStretch()
                break
            case "cover":
                this.parentAttachCover()
                break
            case "fit":
                this.parentAttachFit()
                break
            case "fixed":
                this.parentAttachFixed()
                break
        }

        // Add the SVG element to the parent element.
        this.parent.appendChild( this.svg )
    }

    parentAttachStretch( initalSize = 100 ) {
        // Set Attributes to have the target width and height
        this.svg.setAttribute( "style", `width: 100px; height: 100px` )

        // Reset old resizeObserver, create new one
        this.resizeObserver?.disconnect()
        this.resizeObserver = new ResizeObserver( entries => {

            // Get the size of the parent element.
            const parent = entries[0]
            const size = { x: parent.target.clientWidth, y: parent.target.clientHeight }

            // Scale the SVG element according to the parent size.
            this.svg.style.transform =
                `translate(${( size.x - initalSize ) / 2}px,${( size.y - initalSize ) / 2}px)` +
                `scale(${size.x / initalSize},-${size.y / initalSize})`

        } )
        this.resizeObserver.observe( this.parent )
    }
    parentAttachCover( initalSize = 100 ) {
        // Set Attributes to have the target width and height
        this.svg.setAttribute( "style", `width: 100px; height: 100px;` )
        this.parent.style.overflow = "hidden"

        // Reset old resizeObserver, create new one
        this.resizeObserver?.disconnect()
        this.resizeObserver = new ResizeObserver( entries => {

            // Get the size of the parent element.
            const parent = entries[0]
            const size = new vec2( parent.target.clientWidth, parent.target.clientHeight )
            const max = Math.max( size.x, size.y )

            // Scale the SVG element according to the parent size.
            this.svg.style.transform =
                `translate(${( size.x - initalSize ) / 2}px,${( size.y - initalSize ) / 2}px)` +
                `scale(${max / initalSize},-${max / initalSize})`

        } )
        this.resizeObserver.observe( this.parent )
    }
    parentAttachFit( initalSize = 100 ) {
        // Set Attributes to have the target width and height
        this.svg.setAttribute( "style", `width: 100px; height: 100px;` )

        // Reset old resizeObserver, create new one
        this.resizeObserver?.disconnect()
        this.resizeObserver = new ResizeObserver( entries => {

            // Get the size of the parent element.
            const parent = entries[0]
            const size = new vec2( parent.target.clientWidth, parent.target.clientHeight )
            const min = Math.min( size.x, size.y )

            // Scale the SVG element according to the parent size.
            this.svg.style.transform =
                `translate(${( size.x - initalSize ) / 2}px,${( size.y - initalSize ) / 2}px)` +
                `scale(${min / initalSize},-${min / initalSize})`

        } )
        this.resizeObserver.observe( this.parent )
    }
    parentAttachFixed( initalSize = 100 ) {
        // Set Attributes to have the target width and height
        this.svg.setAttribute( "style", `width: 100px; height: 100px;` )
        // Reset old resizeObserver
        this.resizeObserver?.disconnect()
    }

    /**
     * Maps the mouse position to the SVG element.
     * @param {Vector2D} mousePos 
     * @returns {Vector2D}
     */
    mapMouse( mousePos ) {
        const rect = this.svg.getBoundingClientRect()
        return new vec2(
            ( mousePos.x - rect.left ) / rect.width,
            1 - ( mousePos.y - rect.top ) / rect.height
        )
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



export const SVG = Object.freeze( Object.assign(
    SVGGlobal, {
    g: SVGGroup,
    text: SVGText,
    rect: SVGRectangle,
    circle: SVGCircle,
    ellipse: SVGEllipse,
    line: SVGLine,
    path: SVGPath,
    arc: SVGArc,
} ) )
/**
 * A 2D vector class that inherits from Float64Array for performance reasons.
 * @extends Float64Array
 */
export class Vector2D extends Float64Array {
    static get x() { return new Vector2D( 1, 0 ) }
    static get y() { return new Vector2D( 0, 1 ) }
    static get zero() { return new Vector2D( 0, 0 ) }
    static get NaN() { return new Vector2D( NaN, NaN ) }

    /**
     * Creates a new Vector2D instance from various types of inputs.
     * If the input is invalid or no arguments are provided, a (0, 0) vector is returned.
     * @param {Array|Object|Vector2D|number|bigint} x - The input data for creating the vector, or the x component if two arguments are provided.
     * @param {number|bigint} y - The y component of the vector if two arguments are provided.
     * @returns {Vector2D} A new Vector2D instance.
     */
    static new( x, y ) {
        if ( arguments.length === 0 ) {
            return Vector2D.zero
        }
        if ( arguments.length === 1 ) {
            const input = x
            if ( input instanceof Vector2D ) {
                return new Vector2D( input.x, input.y )
            }
            if ( Array.isArray( input ) ) {
                return new Vector2D( input[0], input[1] )
            }
            if ( typeof input === 'object' && 'x' in input && 'y' in input ) {
                return new Vector2D( input.x, input.y )
            }
            if ( typeof input === 'number' || typeof input === 'bigint' ) {
                return new Vector2D( Number( input ), Number( input ) )
            }
        }
        if ( arguments.length === 2 ) {
            return new Vector2D( Number( x ), Number( y ) )
        }
        return Vector2D.NaN
    }

    /**
     * Creates a new Vector2D instance.
     * @param {number} x - The x component of the vector.
     * @param {number} y - The y component of the vector.
     */
    constructor( x, y ) {
        super( 2 )
        this[0] = x
        this[1] = y
    }

    /**
     * The x component of the vector.
     * @type {number}
     */
    get x() { return this[0] }
    /**
     * Sets the x component of the vector.
     * @param {number} value - The new value for the x component.
     */
    set x( value ) { this[0] = value }

    /**
     * The y component of the vector.
     * @type {number}
     */
    get y() { return this[1] }
    /**
     * Sets the y component of the vector.
     * @param {number} value - The new value for the y component.
     */
    set y( value ) { this[1] = value }

    /**
     * Returns a new vector with components (x, x).
     * @type {Vector2D}
     */
    get xx() { return new Vector2D( this.x, this.x ) }

    /**
     * Returns a new vector with components (x, y).
     * @type {Vector2D}
     */
    get xy() { return new Vector2D( this.x, this.y ) }
    /**
     * Sets the x and y components of the vector to the values provided.
     * @param {Vector2D|number} value - The new vector or scalar value to set.
     */
    set xy( value ) {
        if ( value instanceof Vector2D ) {
            this.x = value.x
            this.y = value.y
        } else {
            this.x = this.y = value
        }
    }

    /**
     * Returns a new vector with components (y, x).
     * @type {Vector2D}
     */
    get yx() { return new Vector2D( this.y, this.x ) }
    /**
     * Sets the y and x components of the vector to the values provided.
     * @param {Vector2D|number} value - The new vector or scalar value to set.
     */
    set yx( value ) {
        if ( value instanceof Vector2D ) {
            this.y = value.x
            this.x = value.y
        } else {
            this.x = this.y = value
        }
    }

    /**
     * Returns a new vector with components (y, y).
     * @type {Vector2D}
     */
    get yy() { return new Vector2D( this.y, this.y ) }

    /**
     * Creates a new Vector2D instance with the same components as this vector.
     * @returns {Vector2D} A new Vector2D instance with the cloned components.
     */
    clone() { return new Vector2D( this.x, this.y ) }

    /**
     * Adds a vector or scalar to this vector.
     * @param {Vector2D|number} other - The vector or scalar to add.
     * @returns {Vector2D} A new Vector2D instance with the result of the addition.
     */
    add( other ) {
        if ( other instanceof Vector2D ) {
            return new Vector2D( this.x + other.x, this.y + other.y )
        } else if ( typeof other === 'number' ) {
            return new Vector2D( this.x + other, this.y + other )
        }
        return Vector2D.NaN
    }

    /**
     * Subtracts a vector or scalar from this vector.
     * @param {Vector2D|number} other - The vector or scalar to subtract.
     * @returns {Vector2D} A new Vector2D instance with the result of the subtraction.
     */
    sub( other ) {
        if ( other instanceof Vector2D ) {
            return new Vector2D( this.x - other.x, this.y - other.y )
        } else if ( typeof other === 'number' ) {
            return new Vector2D( this.x - other, this.y - other )
        }
        return Vector2D.NaN
    }

    /**
     * Multiplies this vector by a scalar or component-wise by another vector.
     * @param {Vector2D|number} other - The vector or scalar to multiply by.
     * @returns {Vector2D} A new Vector2D instance with the result of the multiplication.
     */
    mul( other ) {
        if ( other instanceof Vector2D ) {
            return new Vector2D( this.x * other.x, this.y * other.y )
        } else if ( typeof other === 'number' ) {
            return new Vector2D( this.x * other, this.y * other )
        }
        return Vector2D.NaN
    }

    /**
     * Divides this vector by a scalar or component-wise by another vector.
     * @param {Vector2D|number} other - The vector or scalar to divide by.
     * @returns {Vector2D} A new Vector2D instance with the result of the division.
     */
    div( other ) {
        if ( other instanceof Vector2D ) {
            return new Vector2D( this.x / other.x, this.y / other.y )
        } else if ( typeof other === 'number' ) {
            return new Vector2D( this.x / other, this.y / other )
        }
        return Vector2D.NaN
    }

    /**
     * Calculates the length (magnitude) of this vector.
     * @returns {number} The length of the vector.
     */
    length() {
        return Math.sqrt( this.x * this.x + this.y * this.y )
    }


    /**
     * Normalizes this vector to a unit vector.
     * @returns {Vector2D} A new Vector2D instance with the normalized components.
     */
    normalize() {
        const length = this.length()
        if ( length === 0 ) {
            return Vector2D.zero
        }
        return new Vector2D( this.x / length, this.y / length )
    }


    /**
     * Calculates the dot product of two vectors.
     * @param {Vector2D} a - The first vector.
     * @param {Vector2D} b - The second vector.
     * @returns {number} The dot product of the two vectors.
     */
    static dot( a, b ) {
        if ( a instanceof Vector2D && b instanceof Vector2D ) {
            return a.x * b.x + a.y * b.y
        }
        return NaN
    }

    /**
     * Linearly interpolates between two vectors.
     * @param {Vector2D} a - The start vector.
     * @param {Vector2D} b - The end vector.
     * @param {number} t - The interpolation factor, typically between 0 and 1.
     * @returns {Vector2D} The interpolated vector.
     */
    static lerp( a, b, t ) {
        const x = a.x + ( b.x - a.x ) * t
        const y = a.y + ( b.y - a.y ) * t
        return new Vector2D( x, y )
    }

    /**
     * Calculates the distance between two vectors.
     * @param {Vector2D} a - The first vector.
     * @param {Vector2D} b - The second vector.
     * @returns {number} The distance between the two vectors.
     */
    static distance( a, b ) {
        if ( a instanceof Vector2D && b instanceof Vector2D ) {
            const dx = a.x - b.x
            const dy = a.y - b.y
            return Math.sqrt( dx * dx + dy * dy )
        }
        return NaN
    }
}
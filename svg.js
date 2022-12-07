function Arr() {
    return new Proxy(new Array(), {
        set: function( target, key, value ) {
            if (+key < 0) target[ target.length + +key ] = value
            else          target[key] = value
        },
        get: function( target, key ) {
            if (+key < 0) return target[ target.length + +key ]
                          return target[key]
        }
    })
}


class SVG {
    constructor() {
        this.ctx = Arr()
    }
    
    /** @param {string} name */
    createObject( name ) {
        return { type: name, toString: function(){ return name } }
    }

    pos(x, y) {
        this.x(x), this.y(y)
        return this
    }
    x(x) {
        const obj = this.ctx[-1]
        switch (obj?.type) {
            case "circle":
                obj.cx = x
                break
        }
        return this
    }
    y(y) {
        const obj = this.ctx[-1]
        switch (obj?.type) {
            case "circle":
                obj.cy = y
                break
        }
        return this
    }

    radius(r) {
        return this.r(r)
    }
    r(r) {
        const obj = this.ctx[-1]
        switch (obj?.type) {
            case "circle":
                obj.r = r
                break
        }
        return this
    }

    circle() {
        this.ctx.push( this.createObject("circle") )
        return this
    }

    line() {
        this.ctx.push( this.createObject("line") )
        return this
    }

    

}


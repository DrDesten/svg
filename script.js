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


const globalSVG = SVG( "#clock" )


colors = ["#213","#6de","#8fb"]

const timewarp = 1
const handles = [
    new SVG.arc().center(50).radius(40).color("#d11").width(10).onUpdate( function(obj, time) {
        // Hour Handle
        const milliseconds = Date.now() - new Date().setHours(0,0,0,0)
        const days         = milliseconds * timewarp / 1000 / 60 / 60 / 12 % 1 // Days since Midnight
        
        const fadeIn   = fadeInSmoothest(5600)(time)
        const fadeWrap = smootheststep( days, (3600*12-5)/(3600*12), 1 ) * fadeIn
        const offset   = (fadeIn - 1) * 1.2
        this.anglesNormalized(offset + fadeWrap * days, offset + fadeIn * days)
        this.opacity( fadeIn )
    }).update(),
    new SVG.arc().center(50).radius(30).color("#fff").width(8).onUpdate( function(obj, time) {
        // Minute Handle
        const milliseconds = Date.now() - new Date().setMinutes(0,0,0)
        const hours        = milliseconds * timewarp / 1000 / 60 / 60 % 1 // Hours since last Hour
        
        const fadeIn   = fadeInSmoother(4800)(time)
        const fadeWrap = smootheststep( hours, 3595/3600, 1 ) * fadeIn
        const offset   = (fadeIn - 1) * 1.1
        this.anglesNormalized(offset + fadeWrap * hours, offset + fadeIn * hours)
        this.opacity( fadeIn )
    }).update(),
    new SVG.arc().center(50).radius(22).color("#666").width(6).onUpdate( function(obj, time) {
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
        new SVG.line().mode("angle").center(50).radii(20.5,23.5).width(0.5).color("#888").angleNormalized( i / lineCount ).onUpdate( function( obj, time ) {
            // Second Handle
            const milliseconds = Date.now() - new Date().setSeconds(0,0)
            const handleAngle  = milliseconds * timewarp / 1000 / 60 % 1 // Minutes since last minute

            const fadeIn = fadeInSmooth(1000, 4500)(time)
            const distanceFade = ( 1 - mod( i / lineCount - handleAngle, 1 ) ) ** 15

            this.opacity( distanceFade * fadeIn )
        }).update()
    ),
    handleLines.push(
        new SVG.line().mode("angle").center(50).radii(28,32).width(i % 5 ? 0.75 : 1 ).color( i % 15 ? "#888" : "#d11" ).angleNormalized( i / lineCount ).onUpdate( function( obj, time ) {
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
        new SVG.line().mode("angle").center(50).radii(37,43).width(2).color( i % 3 ? "#888" : "#d11" ).angleNormalized( i / hourLineCount ).onUpdate( function( obj, time ) {
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

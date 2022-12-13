const globalSVG = new SVG( "#canvas" )

let swirl = new SVG.path().mode("bezier")
    .point(0,0)
    .point(40,80)
    .point(100,20)
    .point(30,20)
    .point(50,60)
    .point(50,40)
    .update()

let square = new SVG.path().mode("bezier")
    .point(20,80)
    .point(80,80)
    .point(80,20)
    .point(20,20)
    .close()
    .update()

globalSVG.add(
    square,
    //swirl
)
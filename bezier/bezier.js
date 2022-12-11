const globalSVG = new SVG( "#canvas" )


globalSVG.add(
    new SVG.path()
        .mode("bezier")
        .point(0,0)
        .point(40,80)
        .point(100,20)
        .point(30,20)
        .point(50,60)
        .point(50,40)
        .update()
)
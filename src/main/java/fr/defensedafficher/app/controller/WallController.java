package fr.defensedafficher.app.controller;

import fr.defensedafficher.app.model.Drawing;
import fr.defensedafficher.app.model.Wall;
import org.wisdom.api.DefaultController;
import org.wisdom.api.annotations.*;
import org.wisdom.api.http.HttpMethod;
import org.wisdom.api.http.Result;
import org.wisdom.api.model.Crud;

import javax.validation.Valid;
import java.util.Optional;

/**
 * Created by antoine on 10/10/2016.
 */
@Controller
public class WallController extends DefaultController {

    @Model(Wall.class)
    private Crud<Wall, String> wallCrud;

    @Route(method = HttpMethod.GET, uri = "/api/walls/{wallId}")
    public Result getWall(@Parameter("wallId") final String wallId) {
        Wall wall = wallCrud.findOne(wallId);
        if (wall == null) {
            wall = createWall(wallId);
        }
        return ok(wall).json();
    }

    @Route(method = HttpMethod.POST, uri = "/api/walls/{wallId}", accepts = "application/json")
    public Result updateDrawing(@Parameter("wallId") final String wallId, @Valid @Body final Drawing drawing) {
        logger().info("Update drawing for wall " + wallId);
        logger().info("Received drawing : " + drawing);
        Wall wall = wallCrud.findOne(wallId);
        Optional<Drawing> existingDrawing = wall.getDrawings()
                .stream()
                .filter(d -> d.getName().equals(drawing.getName()))
                .findFirst();
        if (existingDrawing.isPresent()) {
            logger().info("Drawing already exist, updating existing drawing");
            updateDrawingData(existingDrawing.get(), drawing);
        } else {
            logger().info("Drawing does not exist, adding new drawing to wall");
            wall.getDrawings().add(drawing);
        }
        wall = wallCrud.save(wall);
        return ok(wall).json();
    }

    private void updateDrawingData(Drawing existingDrawing, Drawing newDrawing) {
        existingDrawing.setColor(newDrawing.getColor());
        existingDrawing.setDrag(newDrawing.getDrag());
        existingDrawing.setSize(newDrawing.getSize());
        existingDrawing.setX(newDrawing.getX());
        existingDrawing.setY(newDrawing.getY());
    }

    private Wall createWall(String wallId) {
        Wall wall = new Wall();
        wall.setName(wallId);
        wall.setPath("/walls/");
        return wallCrud.save(wall);
    }

}

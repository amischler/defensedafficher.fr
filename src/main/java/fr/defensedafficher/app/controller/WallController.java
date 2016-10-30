package fr.defensedafficher.app.controller;

import fr.defensedafficher.app.model.Drawing;
import fr.defensedafficher.app.model.Wall;
import org.apache.felix.ipojo.annotations.Requires;
import org.wisdom.api.DefaultController;
import org.wisdom.api.annotations.*;
import org.wisdom.api.content.Json;
import org.wisdom.api.http.HttpMethod;
import org.wisdom.api.http.Result;
import org.wisdom.api.http.websockets.Publisher;
import org.wisdom.api.model.Crud;

import javax.validation.Valid;
import java.util.Optional;

/**
 * Created by antoine on 10/10/2016.
 */
@Controller
public class WallController extends DefaultController {

    public static class Point {

        public Point() {
        }

        public Point(String name, int x, int y, String size, boolean drag, String color, String tool) {
            this.name = name;

            this.x = x;
            this.y = y;
            this.size = size;
            this.drag = drag;
            this.color = color;
            this.tool = tool;
        }

        private String name;

        protected int x;

        protected int y;

        protected String size;

        protected boolean drag;

        protected String color;

        protected String tool;

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public int getX() {
            return x;
        }

        public void setX(int x) {
            this.x = x;
        }

        public int getY() {
            return y;
        }

        public void setY(int y) {
            this.y = y;
        }

        public String getSize() {
            return size;
        }

        public void setSize(String size) {
            this.size = size;
        }

        public boolean isDrag() {
            return drag;
        }

        public void setDrag(boolean drag) {
            this.drag = drag;
        }

        public String getColor() {
            return color;
        }

        public void setColor(String color) {
            this.color = color;
        }

        public String getTool() {
            return tool;
        }

        public void setTool(String tool) {
            this.tool = tool;
        }

        @Override
        public String toString() {
            return "Point{" +
                    "name='" + name + '\'' +
                    ", x=" + x +
                    ", y=" + y +
                    ", size='" + size + '\'' +
                    ", drag=" + drag +
                    ", color='" + color + '\'' +
                    ", tool='" + tool + '\'' +
                    '}';
        }

    }

    @Requires
    Publisher publisher;

    @Requires
    Json json;

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

    @OnMessage("/draw/{wallId}")
    public void onAddPoint(@Parameter("wallId") final String wallId,
                           @Valid @Body final Point point) {
        logger().info("Point received for drawing {} : {}", point);
        Wall wall = wallCrud.findOne(wallId);
        Optional<Drawing> existingDrawing = wall.getDrawings()
                .stream()
                .filter(d -> d.getName().equals(point.getName()))
                .findFirst();
        if (existingDrawing.isPresent()) {
            updateDrawingData(existingDrawing.get(), point);
        } else {
            logger().info("Drawing does not exist, adding new drawing to wall");
            Drawing drawing = new Drawing();
            drawing.setName(point.getName());
            updateDrawingData(drawing, point);
            wall.getDrawings().add(drawing);
        }
        publisher.publish("/draw/" + wallId, json.toJson(point));
        wallCrud.save(wall);
    }

    private void updateDrawingData(Drawing drawing, Point point) {
        drawing.getColor().add(point.color);
        drawing.getDrag().add(point.drag);
        drawing.getSize().add(point.size);
        drawing.getX().add(point.x);
        drawing.getY().add(point.y);
        drawing.getTool().add(point.tool);
    }

    private Wall createWall(String wallId) {
        Wall wall = new Wall();
        wall.setName(wallId);
        wall.setPath("/walls/");
        return wallCrud.save(wall);
    }

}

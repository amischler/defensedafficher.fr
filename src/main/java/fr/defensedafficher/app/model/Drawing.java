package fr.defensedafficher.app.model;

import org.jcrom.AbstractJcrEntity;
import org.jcrom.annotations.JcrNode;
import org.jcrom.annotations.JcrProperty;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

/**
 * Created by antoine on 12/10/2016.
 */
@JcrNode(nodeType = "defensedafficher:drawing")
public class Drawing extends AbstractJcrEntity {

    @JcrProperty
    private List<Integer> x = new ArrayList<>();

    @JcrProperty
    private List<Integer> y = new ArrayList<>();

    @JcrProperty
    private List<String> size = new ArrayList<>();

    @JcrProperty
    private List<Boolean> drag = new ArrayList<>();

    @JcrProperty
    private List<String> color = new ArrayList<>();

    @JcrProperty
    private List<String> tool = new ArrayList<>();

    @JcrProperty
    private Date date;

    public List<Integer> getX() {
        return x;
    }

    public void setX(List<Integer> x) {
        this.x = x;
    }

    public List<Integer> getY() {
        return y;
    }

    public void setY(List<Integer> y) {
        this.y = y;
    }

    public List<String> getSize() {
        return size;
    }

    public void setSize(List<String> size) {
        this.size = size;
    }

    public List<Boolean> getDrag() {
        return drag;
    }

    public void setDrag(List<Boolean> drag) {
        this.drag = drag;
    }

    public List<String> getColor() {
        return color;
    }

    public void setColor(List<String> color) {
        this.color = color;
    }

    public List<String> getTool() {
        return tool;
    }

    public void setTool(List<String> tool) {
        this.tool = tool;
    }

    public Date getDate() {
        return date;
    }

    public void setDate(Date date) {
        this.date = date;
    }

}

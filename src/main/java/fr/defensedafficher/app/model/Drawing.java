package fr.defensedafficher.app.model;

import org.jcrom.AbstractJcrEntity;
import org.jcrom.annotations.JcrNode;
import org.jcrom.annotations.JcrProperty;

import java.util.Arrays;

/**
 * Created by antoine on 12/10/2016.
 */
@JcrNode(nodeType = "defensedafficher:drawing")
public class Drawing extends AbstractJcrEntity {

    @JcrProperty
    private int[] x;

    @JcrProperty
    private int[] y;

    @JcrProperty
    private String[] size;

    @JcrProperty
    private boolean[] drag;

    @JcrProperty
    private String[] color;

    @JcrProperty
    private String[] tool;

    public int[] getX() {
        return x;
    }

    public void setX(int[] x) {
        this.x = x;
    }

    public int[] getY() {
        return y;
    }

    public void setY(int[] y) {
        this.y = y;
    }

    public String[] getSize() {
        return size;
    }

    public void setSize(String[] size) {
        this.size = size;
    }

    public boolean[] getDrag() {
        return drag;
    }

    public void setDrag(boolean[] drag) {
        this.drag = drag;
    }

    public String[] getColor() {
        return color;
    }

    public void setColor(String[] color) {
        this.color = color;
    }

    public String[] getTool() {
        return tool;
    }

    public void setTool(String[] tool) {
        this.tool = tool;
    }

    @Override
    public String toString() {
        return "Drawing{" +
                "x=" + Arrays.toString(x) +
                ", y=" + Arrays.toString(y) +
                ", size=" + Arrays.toString(size) +
                ", drag=" + Arrays.toString(drag) +
                ", color=" + Arrays.toString(color) +
                ", tool=" + Arrays.toString(tool) +
                '}';
    }

}

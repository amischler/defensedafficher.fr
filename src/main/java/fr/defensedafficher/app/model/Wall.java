package fr.defensedafficher.app.model;

import org.jcrom.AbstractJcrEntity;
import org.jcrom.annotations.JcrChildNode;
import org.jcrom.annotations.JcrNode;

import java.util.ArrayList;
import java.util.List;

/**
 * Created by antoine on 23/10/2016.
 */
@JcrNode(nodeType = "defensedafficher:wall")
public class Wall extends AbstractJcrEntity {

    @JcrChildNode
    private List<Drawing> drawings = new ArrayList<>();

    public List<Drawing> getDrawings() {
        return drawings;
    }

    public void setDrawings(List<Drawing> drawings) {
        this.drawings = drawings;
    }

    @Override
    public String toString() {
        return "Wall{" +
                "drawings=" + drawings +
                '}';
    }

}

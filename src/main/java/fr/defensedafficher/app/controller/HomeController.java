package fr.defensedafficher.app.controller;

import org.wisdom.api.DefaultController;
import org.wisdom.api.annotations.Controller;
import org.wisdom.api.annotations.Parameter;
import org.wisdom.api.annotations.Route;
import org.wisdom.api.annotations.View;
import org.wisdom.api.http.HttpMethod;
import org.wisdom.api.http.Result;
import org.wisdom.api.templates.Template;

/**
 * Created by antoine on 23/10/2016.
 */
@Controller
public class HomeController extends DefaultController {

    @View("index")
    Template home;

    @Route(method = HttpMethod.GET, uri = "/")
    public Result index() {
        return indexWithWallId("1");
    }

    @Route(method = HttpMethod.GET, uri = "/{wallId}")
    public Result indexWithWallId(@Parameter("wallId") final String wallId) {
        return ok(render(home, "wallId", wallId));
    }

}

package fr.defensedafficher.app.controll;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.wisdom.test.http.HttpResponse;
import org.wisdom.test.parents.WisdomBlackBoxTest;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Test basic wall controller features.
 * <p/>
 * Created by antoine on 23/10/2016.
 */
public class WallControllerIT extends WisdomBlackBoxTest {

    public final static Logger logger = LoggerFactory.getLogger(WallControllerIT.class);

    @Test
    public void testWallController() throws Exception {
        HttpResponse<JsonNode> response = get("/api/walls/wall1").asJson();
        logger.info("Received wall : " + response.body().toString());
        assertThat(response.code()).isEqualTo(OK);
        assertThat(response.body().get("name").asText()).isEqualTo("wall1");
        assertThat(response.body().get("drawings").size()).isEqualTo(0);
        // test creation of a new drawing
        String body = "{\"x\": 1,\"y\": 2,\"color\": \"red\",\"size\": \"normal\", \"drag\": true}";
        logger.info("Creating drawing " + body);
        HttpResponse<JsonNode> response2 = post("ws:///localhost:9000/api/socket/wall1/drawing1").header("Content-Type", "application/json").body(body).asJson();
        assertThat(response2.code()).isEqualTo(OK);
        logger.info("Received wall : " + response2.body().toString());
        assertThat(response2.body().get("name").asText()).isEqualTo("wall1");
        assertThat(response2.body().get("drawings").size()).isEqualTo(1);
        assertThat(response2.body().get("drawings").get(0).get("x").size()).isEqualTo(2);
        assertThat(response2.body().get("drawings").get(0).get("x").get(0).asInt()).isEqualTo(1);
        assertThat(response2.body().get("drawings").get(0).get("x").get(1).asInt()).isEqualTo(2);
        // test update of an existing drawing
        String body2 = "{\"name\":\"drawing1\",\"x\":[1, 2, 3],\"y\":[2, 1, 0],\"color\":[\"red\", \"red\", \"red\"],\"size\":[\"normal\",\"normal\", \"normal\"],\"drag\":[true, false, true]}";
        HttpResponse<JsonNode> response3 = post("ws://localhost:9000/api/walls/wall1").header("Content-Type", "application/json").body(body2).asJson();
        assertThat(response3.code()).isEqualTo(OK);
        logger.info("Received wall : " + response3.body().toString());
        assertThat(response3.body().get("name").asText()).isEqualTo("wall1");
        assertThat(response3.body().get("drawings").size()).isEqualTo(1);
        assertThat(response3.body().get("drawings").get(0).get("x").size()).isEqualTo(3);
        assertThat(response3.body().get("drawings").get(0).get("x").get(0).asInt()).isEqualTo(1);
        assertThat(response3.body().get("drawings").get(0).get("x").get(1).asInt()).isEqualTo(2);
        assertThat(response3.body().get("drawings").get(0).get("x").get(2).asInt()).isEqualTo(3);
    }

}

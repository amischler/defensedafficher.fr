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
    }

}

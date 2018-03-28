package cs.brown.edu.aelp.pokemon;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.eclipse.jetty.websocket.api.Session;

import cs.brown.edu.aelp.Player.Player;
import cs.brown.edu.aelp.general_datastructures.Coordinate3d;
import cs.brown.edu.aelp.networking.PlayerWebSocketHandler;
import spark.Spark;

/**
 * The Main class entry point.
 */
public final class Main {
  
  // we use this to map sessions to session ids
  public static Map<Session, String> sessionToID = new ConcurrentHashMap<>();
  // We use this for websockets to continue creating unique session id's
  public static int sessionNumber = 0;
  
  // maps session id's to Player objects
  public static Map<String, Player> sessionIDToPlayer;

  /**
   * @param args
   *          Command line arguments
   */
  public static void main(String[] args) {
    new Main().run(args);
  }

  /**
   * Private constructor for main.
   */
  private Main() {

  }

  /**
   * Entry point.
   *
   * @param args
   *          Command line arguments
   */
  private void run(String[] args) {
    Spark.webSocket("/play", PlayerWebSocketHandler.class);
    System.out.println("Hello, World!");
  }

}

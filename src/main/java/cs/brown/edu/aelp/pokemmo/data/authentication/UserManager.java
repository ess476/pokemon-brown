package cs.brown.edu.aelp.pokemmo.data.authentication;

import cs.brown.edu.aelp.pokemmo.data.DataSource;
import cs.brown.edu.aelp.pokemmo.data.DataSource.AuthException;
import cs.brown.edu.aelp.pokemon.Main;
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

public final class UserManager {

  private static final Map<Integer, User> users = new HashMap<>();

  private UserManager() {
  }

  /**
   * Attempt to authenticate a user by username and password, expiring and
   * re-generating their token if successful.
   *
   * @param username
   *          username
   * @param pass
   *          password
   * @return the User
   * @throws AuthException
   *           if something goes wrong
   */
  public static User authenticate(String username, String pass)
      throws AuthException {
    DataSource data = Main.getDataSource();
    User user = data.authenticateUser(username, pass);
    if (users.containsKey(user.getId())) {
      // We want to use their data from memory, but now they've got a new token.
      User memUser = users.get(user.getId());
      memUser.setToken(user.getToken());
      memUser.validateLocation();
      return memUser;
    } else {
      users.put(user.getId(), user);
      return user;
    }
  }

  /**
   * Attempt to authenticate a user by id and token.
   *
   * @param id
   *          their id
   * @param token
   *          their token
   * @return a User
   * @throws AuthException
   *           if something goes wrong
   */
  public static User authenticate(int id, String token) throws AuthException {
    if (users.containsKey(id)) {
      if (users.get(id).getToken() != null
          && users.get(id).getToken().equals(token)) {
        users.get(id).validateLocation();
        return users.get(id);
      } else {
        throw new AuthException("Invalid token.");
      }
    } else {
      User user = Main.getDataSource().authenticateUser(id, token);
      users.put(user.getId(), user);
      return user;
    }
  }

  public static User register(String username, String password, String email,
      String species, String nickname) throws AuthException {
    DataSource data = Main.getDataSource();
    User u = data.registerUser(username, password, email, species, nickname);
    users.put(u.getId(), u);
    return u;
  }

  /**
   * Remove all disconnected Users from memory. This should never be called
   * unless by the saving thread, immediately after a save!
   */
  public static void purgeDisconnectedUsers() {
    for (int id : users.keySet()) {
      if (!users.get(id).isConnected()) {
        users.remove(id);
      }
    }
  }

  /**
   * Returns a collection of all Users that are either currently connected or
   * have disconnected but not yet been saved.
   *
   * @return an unmodifiable collection of Users
   */
  public static Collection<User> getAllUsers() {
    return Collections.unmodifiableCollection(users.values());
  }

  /**
   * Gets a user by an id.
   * 
   * @param id
   *          Id of user we are getting.
   * @return The user that corresponds to the id.
   */
  public static User getUserById(int id) {
    return users.get(id);
  }
}

/**
 * Persists login session to MongoDB before sending the HTTP response.
 */
const persistUserSession = (req, user) =>
  new Promise((resolve, reject) => {
    req.session.regenerate((regenerateError) => {
      if (regenerateError) {
        reject(regenerateError);
        return;
      }

      req.session.user = {
        id: String(user._id),
        email: user.email
      };

      req.session.save((saveError) => {
        if (saveError) {
          reject(saveError);
          return;
        }

        resolve();
      });
    });
  });

module.exports = {
  persistUserSession
};

// ============================================
// PASSPORT.JS - Google OAuth 2.0 Configuration
// ============================================
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';

const configurePassport = () => {
  // ──────────────────────────────────────
  // Serialize user
  // ──────────────────────────────────────
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // ──────────────────────────────────────
  // Deserialize user
  // ──────────────────────────────────────
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  // ──────────────────────────────────────
  // Google OAuth 2.0 Strategy
  // ⚠️ Credentials තියෙනවනම් විතරක් enable කරන්න
  // ──────────────────────────────────────
  if (
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_CLIENT_ID !== 'your_google_client_id_here'
  ) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: process.env.GOOGLE_CALLBACK_URL,
          scope: ['profile', 'email'],
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            console.log(`🔍 Google OAuth - Profile: ${profile.displayName}`.blue);

            let user = await User.findOne({ googleId: profile.id });

            if (user) {
              user.lastLogin = Date.now();
              await user.save({ validateBeforeSave: false });
              console.log(`✅ Existing Google user logged in: ${user.email}`.green);
              return done(null, user);
            }

            user = await User.findOne({ email: profile.emails[0].value });

            if (user) {
              user.googleId = profile.id;
              user.authProvider = 'google';
              user.isEmailVerified = true;
              user.lastLogin = Date.now();

              if (user.avatar.public_id === 'default_avatar') {
                user.avatar = {
                  public_id: `google_${profile.id}`,
                  url: profile.photos[0]?.value || user.avatar.url,
                };
              }

              await user.save({ validateBeforeSave: false });
              console.log(`🔗 Google linked to existing account: ${user.email}`.cyan);
              return done(null, user);
            }

            const newUser = await User.create({
              name: profile.displayName,
              email: profile.emails[0].value,
              password: `Google_${Date.now()}_${Math.random().toString(36)}`,
              googleId: profile.id,
              authProvider: 'google',
              isEmailVerified: true,
              avatar: {
                public_id: `google_${profile.id}`,
                url: profile.photos[0]?.value || 'https://res.cloudinary.com/demo/image/upload/v1/default-avatar.png',
              },
              lastLogin: Date.now(),
            });

            console.log(`🆕 New Google user created: ${newUser.email}`.green);
            return done(null, newUser);

          } catch (error) {
            console.error(`❌ Google OAuth Error: ${error.message}`.red);
            return done(error, null);
          }
        }
      )
    );

    console.log('✅ Google OAuth Strategy configured'.green);
  } else {
    console.log('⚠️  Google OAuth not configured (no credentials). Skipping...'.yellow);
  }
};

export default configurePassport;
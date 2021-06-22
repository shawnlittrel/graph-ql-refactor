const { AuthenticationError } = require('apollo-server-express');
const { Book, User } = require('../models');
const { signToken } = require('../utils/auth');

//what api calls do we need to make?
// createUser -> mutation  -> DONE
// login -> mutation  -> DONE
// saveBook -> mutation
// deleteBook -> mutation
// getSingleUser -> query
// getMe -> query

const resolvers = {
     Query:{
          me: async (parent, args, context) => {
               if(context.user) {
                    const userData = await User.findOne({
                         _id: context.user._id
                    })
                    .select('-__v -password')
                    .populate('savedBooks');

                    return userData;
               }
               throw new AuthenticationError('Not logged in');
          },
     },
     Mutation:{
          addUser: async (parent, args) => {
               const user = await User.create(args);
               const token = signToken(user);

               return { token, user };
          },

          login: async (parent, { email, password }) => {
               const user = await User.findOne({ email });

               if (!user) {
                    throw new AuthenticationError('Incorrect Credentials');
               }

               const correctPw = await user.isCorrectPassword(password);

               if (!correctPw) {
                    throw new AuthenticationError('Incorrect Credentials');
               }

               const token = signToken(user);

               return { token, user };
          },

          saveBook: async (parent, { authors, description, title, bookId, image, link }, context) => {
               console.log('context', context);

               if (context.user) {
                    const updatedUser = await User.findOneAndUpdate(
                         { _id: context.user._id },
                         { $addToSet: { savedBooks: 
                              {
                              authors: authors,
                              description: description,
                              title: title,
                              bookId: bookId,
                              image: image,
                              }
                    } },
                         { new: true, runValidators: true }
                    ).populate('savedBooks');

                    return updatedUser;
               }

               throw new AuthenticationError('You need to be logged in');
          },

          removeBook: async (parent, { bookId }, context) => {
               if (context.user) {
                    const updatedUser = await User.findOneAndUpdate(
                         { _id: context.user._id },
                         { $pull: { savedBooks: bookId } },
                         { new: true }
                    )

                    return updatedUser;
               }

               throw new AuthenticationError('You need to be logged in');
          },



     }
};

module.exports = resolvers;
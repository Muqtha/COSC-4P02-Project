# Sprint Backlog 3

| User Story | Task |
| --- | --- |
| As a developer, I would like the bot to recognize athlete names in order to fully understand and return the appropriate answer to a query. |
|   | Implement separate NLP for names |
|   | Integrate NLP with chatbot system backend |
|   | Test functionality for accuracy |
| As a spectator, I would like to be able to request the venue of a specific event, so that I may spectate it. |
|   | Remodel Scraper to work on web pages for venue and events |
|   | Run Scraper on sites to get venue and event information |
|   | Organize json file to suit the system |
| As a manager, I would like for the bot to answer a variety of questions. |   | Make a draft of possible categories (Topics) user could ask about from the site |
|   | Generate a json file with the categories |
|   | Generate sub categories to belong to the topic  |
|   | Fill context with information from scraper or site and format properly tp suit chatbot |
| As a manager, I would like to be able to view logs of chatbot conversations, so I am aware of any issues. |
|   | Integrate google analytics with chatbot |
|   | Create custom events for tracking chatbot I/O |
| As a manager, I would like the bot to provide a reliable source for questions it cannot answer directly. |
|   | Generate a series of common questions chatbot should be able to answer |
|   | Test chatbot's accuracy to finding the correct or most reliable response |
| As a manager, I would like the chatbot to work seamlessly on a mobile device and for its appearance to be appealing. |
|   | Move NLP models to back end to load so it runs faster on ios |
|   | Update chatbot site |
| As a user, I would like to interact with the bot as if it were human. |
|   | Survey people o what kind of greetings would make it seem more friendly or human |
|   | Generate a list of greetings |
|   | Put the Greetings in a suitable category and structure the json file to suit the chatbot |
|   | Test greeting accuracy and satisfaction with users |
| As a spectator, I would like to communicate with the chatbot in French since I am from Quebec and it would make it easier to find events. |
|   | Integrate a language api into the system |
|   | Confirm model translates words appropriately |
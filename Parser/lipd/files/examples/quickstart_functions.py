import random 
import datetime

def what_is_my_name():
    """
    I do not know your name, but this function will be helpful for learning!
    :return: None
    """
    print("I have no idea.")
    return

def what_time_is_it():
    """
    Prints out the current time and day.
    :return: None
    """
    print(str(datetime.datetime.now().strftime("%d %B %Y %I:%M%p")))
    return

def tell_me_a_joke():
    """
    Randomly selects a joke and prints it to the console. 
    :returns: None
    """
    jokes = [
        "A man didn't like his haircut, but it started to grow on him.",
        "Q: What did one snowman say to the other? A: Do you smell carrots?",
        "There’s two fish in a tank. One turns to the other and says 'You man the guns, I’ll drive’",
        "Some jokes just fluorite over my head",
        "Q: Why do Earth Science professors like to teach about ammonia? A: Because it's basic material."
    ]
    
    print(jokes[random.randint(0, len(jokes))])
    return
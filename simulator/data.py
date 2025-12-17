from datetime import date, datetime, timedelta
from enum import Enum
import random

class Sex(Enum):
  MALE = "MALE"
  FEMALE = "FEMALE"
  UNKNOWN = "UNKNOWN"


class RandomDataGenerator:
  first_names = [
    "James",
    "Mary",
    "John",
    "Patricia",
    "Robert",
    "Jennifer",
    "Michael",
    "Linda",
    "William",
    "Elizabeth",
    "David",
    "Barbara",
    "Richard",
    "Susan",
    "Joseph",
    "Jessica",
    "Thomas",
    "Sarah",
    "Charles",
    "Karen",
  ]
  last_names = [
    "Smith",
    "Johnson",
    "Williams",
    "Brown",
    "Jones",
    "Garcia",
    "Miller",
    "Davis",
    "Rodriguez",
    "Martinez",
    "Hernandez",
    "Lopez",
    "Gonzalez",
    "Wilson",
    "Anderson",
    "Thomas",
    "Taylor",
    "Moore",
    "Jackson",
    "Martin",
  ]
  task_titles = [
    "Check blood pressure",
    "Administer insulin",
    "Change wound dressing",
    "Patient transport to X-Ray",
    "Update patient chart",
    "Morning rounds",
    "Check vitals",
    "Administer pain medication",
    "Prepare discharge papers",
    "Consult with specialist",
    "Dietary review",
    "Physical therapy session",
  ]
  ward_names = [
    "Cardiology",
    "Neurology",
    "Pediatrics",
    "Oncology",
    "Emergency",
    "Orthopedics",
    "Geriatrics",
    "Psychiatry",
  ]
  team_names = [
    "Alpha Team",
    "Bravo Team",
    "Night Watch",
    "Early Birds",
    "Rapid Response",
    "Surgical Team A",
    "Consultant Group",
  ]

  @staticmethod
  def get_name():
    return random.choice(RandomDataGenerator.first_names), random.choice(
      RandomDataGenerator.last_names,
    )

  @staticmethod
  def get_task_title():
    return random.choice(RandomDataGenerator.task_titles)

  @staticmethod
  def get_birthdate():
    start_date = date(1940, 1, 1)
    end_date = date(2005, 12, 31)
    delta = end_date - start_date
    random_days = random.randrange(delta.days)
    return (start_date + timedelta(days=random_days)).isoformat()

  @staticmethod
  def get_due_date():
    now = datetime.now()
    random_hours = random.randint(1, 168)
    return (now + timedelta(hours=random_hours)).isoformat()

  @staticmethod
  def get_sex():
    return random.choice(list(Sex)).value
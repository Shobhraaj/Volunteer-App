"""
Seed script — populates the database with realistic demo data
for testing AI matching, recommendations, and analytics.

Usage:
    cd backend
    python seed_data.py
"""

import random
from datetime import datetime, timedelta, timezone
from database import SessionLocal, engine, Base
from models.user import User
from models.task import Task
from models.participation import Participation
from models.badge import Badge
from services.auth_service import hash_password

# ── Configuration ────────────────────────────────────────────────────
NUM_VOLUNTEERS = 20
NUM_ORGANIZERS = 3
NUM_TASKS = 15
NUM_PARTICIPATIONS = 40

SKILL_POOL = [
    "teaching", "cooking", "first_aid", "driving", "counseling",
    "fundraising", "photography", "web_development", "carpentry",
    "gardening", "translation", "event_planning", "mentoring",
    "data_entry", "public_speaking",
]

INTEREST_POOL = [
    "education", "environment", "healthcare", "animals", "elderly_care",
    "youth", "disaster_relief", "arts", "sports", "technology",
]

LOCATIONS = [
    ("Mumbai", 19.076, 72.8777),
    ("Delhi", 28.6139, 77.209),
    ("Bangalore", 12.9716, 77.5946),
    ("Hyderabad", 17.385, 78.4867),
    ("Chennai", 13.0827, 80.2707),
    ("Pune", 18.5204, 73.8567),
    ("Kolkata", 22.5726, 88.3639),
    ("Ahmedabad", 23.0225, 72.5714),
]

DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]

TASK_TEMPLATES = [
    ("Community Teaching Session", "Teach basic literacy to underprivileged children"),
    ("Food Distribution Drive", "Prepare and distribute food packages to homeless shelters"),
    ("First Aid Training Camp", "Conduct first aid training for community members"),
    ("Park Cleanup Initiative", "Organise a cleanup drive at the local park"),
    ("Elderly Home Visit", "Visit and spend time with elderly residents"),
    ("Animal Shelter Support", "Help with feeding and grooming at the animal shelter"),
    ("Tree Planting Drive", "Plant trees in the neighbourhood to improve green cover"),
    ("Blood Donation Camp", "Organise and manage a blood donation camp"),
    ("Career Mentoring Workshop", "Guide students on career choices and college prep"),
    ("Digital Literacy Program", "Teach basic computer skills to senior citizens"),
    ("Fundraising Gala", "Coordinate a fundraising event for the NGO"),
    ("Disaster Relief Packing", "Pack relief materials for flood-affected areas"),
    ("Youth Sports Day", "Organise a sports event for underprivileged youth"),
    ("Photography for Charity", "Capture photos for the NGO's annual report"),
    ("Translation Services", "Translate documents for non-English-speaking communities"),
]


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Clear existing data
    db.query(Badge).delete()
    db.query(Participation).delete()
    db.query(Task).delete()
    db.query(User).delete()
    db.commit()

    print("🌱 Seeding database...")

    # ── Create organizers ────────────────────────────────────────
    organizers = []
    for i in range(NUM_ORGANIZERS):
        loc = random.choice(LOCATIONS)
        org = User(
            email=f"admin{i + 1}@volunteer.org",
            hashed_password=hash_password("MyNewPass123!"),
            full_name=f"Organizer {['Alpha', 'Beta', 'Gamma'][i]}",
            role="organizer",
            skills=[],
            interests=[],
            availability={},
            latitude=loc[1] + random.uniform(-0.05, 0.05),
            longitude=loc[2] + random.uniform(-0.05, 0.05),
            location_name=loc[0],
            points=0,
            reliability_score=1.0,
        )
        db.add(org)
        organizers.append(org)
    db.commit()
    for o in organizers:
        db.refresh(o)
    print(f"   ✅ {NUM_ORGANIZERS} organizers created")

    # ── Create volunteers ────────────────────────────────────────
    volunteers = []
    first_names = [
        "Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Reyansh",
        "Ayaan", "Krishna", "Ishaan", "Ananya", "Diya", "Saanvi", "Aanya",
        "Aadhya", "Myra", "Isha", "Sara", "Navya", "Anika",
    ]
    for i in range(NUM_VOLUNTEERS):
        loc = random.choice(LOCATIONS)
        num_skills = random.randint(2, 6)
        num_interests = random.randint(1, 4)
        avail_days = random.sample(DAYS, random.randint(2, 5))
        availability = {day: ["09:00-17:00"] for day in avail_days}

        vol = User(
            email=f"member{i + 1}@volunteer.org",
            hashed_password=hash_password("MyNewPass123!"),
            full_name=first_names[i],
            role="volunteer",
            skills=random.sample(SKILL_POOL, num_skills),
            interests=random.sample(INTEREST_POOL, num_interests),
            availability=availability,
            latitude=loc[1] + random.uniform(-0.1, 0.1),
            longitude=loc[2] + random.uniform(-0.1, 0.1),
            location_name=loc[0],
            points=random.randint(0, 100),
            reliability_score=round(random.uniform(0.5, 1.0), 2),
        )
        db.add(vol)
        volunteers.append(vol)
    db.commit()
    for v in volunteers:
        db.refresh(v)
    print(f"   ✅ {NUM_VOLUNTEERS} volunteers created")

    # ── Create tasks ─────────────────────────────────────────────
    tasks = []
    urgencies = ["low", "medium", "high", "critical"]
    statuses = ["open", "open", "open", "in_progress", "completed"]
    now = datetime.now(timezone.utc)

    for i in range(NUM_TASKS):
        template = TASK_TEMPLATES[i % len(TASK_TEMPLATES)]
        loc = random.choice(LOCATIONS)
        start = now - timedelta(days=random.randint(-30, 60))
        end = start + timedelta(hours=random.randint(2, 8))
        num_skills = random.randint(1, 3)

        task = Task(
            title=template[0],
            description=template[1],
            organizer_id=random.choice(organizers).id,
            required_skills=random.sample(SKILL_POOL, num_skills),
            urgency=random.choice(urgencies),
            latitude=loc[1] + random.uniform(-0.05, 0.05),
            longitude=loc[2] + random.uniform(-0.05, 0.05),
            location_name=loc[0],
            start_time=start,
            end_time=end,
            max_volunteers=random.randint(3, 10),
            current_volunteers=0,
            status=random.choice(statuses),
            created_at=now - timedelta(days=random.randint(1, 90)),
        )
        db.add(task)
        tasks.append(task)
    db.commit()
    for t in tasks:
        db.refresh(t)
    print(f"   ✅ {NUM_TASKS} tasks created")

    # ── Create participations ────────────────────────────────────
    part_statuses = ["completed", "completed", "completed", "no_show", "assigned", "applied", "cancelled"]
    created_parts = 0
    attempts = 0
    seen_pairs = set()

    while created_parts < NUM_PARTICIPATIONS and attempts < NUM_PARTICIPATIONS * 3:
        attempts += 1
        vol = random.choice(volunteers)
        task = random.choice(tasks)
        pair = (vol.id, task.id)
        if pair in seen_pairs:
            continue
        seen_pairs.add(pair)

        p_status = random.choice(part_statuses)
        applied = task.created_at + timedelta(days=random.randint(0, 5)) if task.created_at else now
        completed_at = applied + timedelta(hours=random.randint(2, 48)) if p_status == "completed" else None

        part = Participation(
            volunteer_id=vol.id,
            task_id=task.id,
            status=p_status,
            match_score=round(random.uniform(40, 98), 2),
            applied_at=applied,
            completed_at=completed_at,
        )
        db.add(part)
        created_parts += 1

    db.commit()
    print(f"   ✅ {created_parts} participations created")

    # ── Update current_volunteers counts ─────────────────────────
    for task in tasks:
        count = (
            db.query(Participation)
            .filter(
                Participation.task_id == task.id,
                Participation.status.in_(["assigned", "completed"]),
            )
            .count()
        )
        task.current_volunteers = count
    db.commit()

    # ── Award some badges ────────────────────────────────────────
    badge_count = 0
    for vol in volunteers:
        comp_count = (
            db.query(Participation)
            .filter(Participation.volunteer_id == vol.id, Participation.status == "completed")
            .count()
        )
        if comp_count >= 1:
            db.add(Badge(user_id=vol.id, badge_type="first_task", badge_name="🌱 First Step"))
            badge_count += 1
        if comp_count >= 5:
            db.add(Badge(user_id=vol.id, badge_type="five_tasks", badge_name="⭐ Rising Star"))
            badge_count += 1
    db.commit()
    print(f"   ✅ {badge_count} badges awarded")

    db.close()
    print("\n🎉 Database seeded successfully!")
    print("   Login credentials: any volunteer/organizer email with password 'MyNewPass123!'")
    print("   Example: admin1@volunteer.org / MyNewPass123!")
    print("   Example: member1@volunteer.org / MyNewPass123!")


if __name__ == "__main__":
    seed()

# Family Tree Visualizer

A web app for recording a family's members, the relationships between them, and the events in their lives, and viewing them as a tree and a timeline.

## Language

**Storage**:
The layer that holds members, relationships, and events and answers every read and write for the app.
_Avoid_: Data layer, persistence layer, backend store

**Demo mode**:
A way of running the app where the Storage holds a Sample dataset in memory instead of the real database, so the app can be used and reviewed without any database. Changes last only until the app stops.
_Avoid_: Dummy mode, in-memory mode, mock mode, offline mode

**Sample dataset**:
The fixed, small family (members, relationships, and events) that Demo mode starts from every time.
_Avoid_: Seed data, dummy data, fixtures (the database seed script keeps the word "seed")

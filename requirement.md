# CampusPulse — Project Requirements

## 1. Project Overview

CampusPulse is a university event management platform where students can discover university programs, register or apply for them, track their participation, and share feedback. Administrators can manage events, registrations, attendance, and feedback.

The main goal is to build a functional MERN stack project that demonstrates CRUD operations, authentication, authorization, database relationships, and frontend-backend integration.

## 2. User Roles

The system has three types of users.

### 2.1 Public Visitor

A public visitor can:
- View upcoming and ongoing events.
- Search and filter events.
- View event details, including date, time, venue, capacity, and registration deadline.
- Access the login and signup pages.

A public visitor cannot register for events or access private student information.

### 2.2 Student

A student can:
- Create an account and log in.
- Browse and search for events.
- Register for open-registration events.
- Apply for application-based events.
- Answer event registration questions.
- View registration and application statuses.
- Cancel a registration where cancellation is permitted.
- View and update their profile information.
- Upload or change their profile picture.
- View attended, registered, and applied events in separate profile sections.
- View their attendance history and total number of attended events.
- Access a unique registration ID or digital pass for a registration.
- Submit feedback after their attendance has been confirmed.

Students cannot change their role or edit their student ID.

### 2.3 Administrator

An administrator can:
- Create, view, update, and delete events.
- Configure event registration types and custom questions.
- View registrations and submitted answers.
- Review applications and accept or reject applicants.
- Manage participant lists.
- Mark registered students as present or absent.
- Correct attendance records when necessary.
- View event feedback, ratings, and comments.
- Manage student accounts when necessary.

Admin access must be assigned securely. Public signup must not allow a user to make themselves an administrator.

## 3. Student Signup and Authentication

### 3.1 Required Signup Fields

- First name
- Last name
- Student ID
- College email address
- Password
- Confirm password

The college email must use the `@sunway.edu.np` domain.

Student ID and email address must be unique.

### 3.2 Password Requirements

- The password must meet a clearly defined minimum length.
- The confirm-password field must match the password.
- Show password requirements near the password field.
- Display a live password-strength indicator.
- Clearly indicate when a password is weak and explain what needs improvement.
- Hash passwords before storing them in the database.

Do not implement OTP verification or external college-system integration unless explicitly requested later.

### 3.3 Authentication

- Use JWT-based authentication.
- Use bcrypt or bcryptjs to hash passwords.
- Protect private frontend routes.
- Enforce authentication and role permissions on the backend.
- Do not trust role information supplied by the frontend.

## 4. Event Management

Each event should contain:
- Event title
- Event description
- Category
- Start date and time
- End date and time
- Venue
- Registration deadline
- Participant capacity
- Registration type
- Custom registration questions, if needed
- Event status: upcoming, ongoing, or completed

Event images and poster uploads are not required in the current project scope.

### 4.1 Registration Types

There are two registration types.

**Open registration**
- Students can register directly.
- Registration is allowed only before the deadline and while capacity is available.
- A successful registration receives a Confirmed status.
- The system must prevent registrations beyond the event capacity.

**Application-based registration**
- Students submit an application.
- The application initially receives a Pending status.
- An administrator can accept or reject the application.
- An accepted applicant becomes a confirmed participant if capacity and other event requirements permit.
- A rejected applicant cannot participate unless the decision is changed by an administrator.

### 4.2 Event Status and Registration Status

Event status and registration status are different.

Event status describes the program:
- Upcoming
- Ongoing
- Completed

Registration or application status describes the student's request:
- Pending
- Confirmed
- Rejected
- Cancelled

Attendance is tracked separately as Present or Absent.

The application must not confuse a completed event with a student's attendance status.

## 5. Custom Registration Forms

Administrators can add simple questions to an event registration form.

Supported question types:
- Short answer
- Paragraph
- Multiple choice

Each question can be required or optional.

Requirements:
- Students must answer all required questions before submitting.
- Store submitted answers in MongoDB.
- Preserve the question text and type alongside each submission so later changes to an event form do not alter the meaning of older submissions.
- Administrators can view answers for each applicant or participant.

Do not build a full Google Forms clone. Conditional questions, drag-and-drop form design, and file-upload questions are outside the current scope.

## 6. Student Profile

The student profile should display the student's basic information and provide three separate sections for browsing their event cards. The layout should be inspired by the separate content tabs on an Instagram profile.

### 6.1 Profile Information

Display:
- Profile picture
- First and last name
- Student ID
- College email address
- Total number of attended events

Students can update their name and profile picture where permitted. Student ID, email uniqueness, and role restrictions must be enforced by the backend.

### 6.2 Three Separate Profile Sections

Below the profile information, display three tabs:

1. **Attended**
2. **Registered**
3. **Applied**

Each tab must behave like a separate content section on a social media profile. When a student selects a tab, display only the event cards belonging to that category.

Do not display all events together in one list with status filters. Each category must have its own clearly defined purpose.

### 6.3 Attended Tab

Display the event cards for programs the student has actually attended.

An event belongs here only when an administrator has marked the student's attendance as Present.

- Use the same event-card component and visual design as the main Events page.
- Display the event's title, category, date, venue, and other information already shown on the standard event card.
- Allow the student to open the event details.
- Do not create a different card design just for the profile.
- Do not include events that were merely registered for or applied to.
- If attendance has not been marked Present, the event must not appear here.

The Attended section represents the student's actual participation history.

### 6.4 Registered Tab

Display event cards for programs the student has successfully registered for or been selected to attend, but has not yet attended.

This includes:
- Upcoming events with confirmed registrations.
- Open-registration events where registration was successful.
- Application-based events where the student was accepted and their registration was confirmed.

Use the same event-card design as the main Events page.

The card should show the event's existing information and its relevant registration status. The student should be able to open the event details and view their unique registration ID or digital pass where applicable.

When the event has finished and the student's attendance is marked Present, move it out of Registered and into Attended.

If the event has finished but attendance has not been recorded, keep it in Registered until the attendance status is updated. Do not automatically treat registration as proof of attendance.

Cancelled or rejected registrations must not appear as active confirmed registrations.

### 6.5 Applied Tab

Display event cards for programs the student has submitted an application for, along with the current status of each application.

This section acts as a record of the student's applications, including applications that are still waiting for a decision or have already received a decision.

Possible statuses include:
- Pending — awaiting an administrator's decision.
- Accepted — selected by the administrator.
- Rejected — not selected.
- Cancelled — application cancelled, where cancellation is permitted.

Use the same event-card design as the main Events page.

Each card must:
- Show the event's existing information.
- Display the current application status clearly.
- Allow the student to open the event details.
- Reflect changes made by an administrator.

**Important:** An accepted application can appear in both Applied and Registered. Applied records the student's application and its outcome, while Registered shows the student's confirmed participation in an event they have not yet attended.

Once the student attends and their attendance is marked Present, the event belongs in Attended. The Applied section may still retain the application record and its outcome.

### 6.6 Shared Event-Card Design

All three profile sections must reuse the same event-card component used on the main Events page.

Do not create three unrelated card designs.

The card should preserve the same:
- Layout and spacing
- Typography
- Event title and details
- Category and date presentation
- Navigation to event details

Only the information relevant to a category, such as registration or application status, should be added where necessary.

The profile tabs determine which events are displayed; they should not change the basic event-card design.

Use a responsive grid so cards display appropriately on desktop and mobile screens.

If a category contains no events, show a simple empty state, such as:
- Attended: "You haven't attended any events yet."
- Registered: "You don't have any confirmed upcoming registrations."
- Applied: "You haven't applied to any events yet."

### 6.7 Data and Category Rules

The three sections must use real data from the backend. Do not hardcode event cards or counts.

Apply these rules:
- **Attended:** attendance is Present.
- **Registered:** registration is Confirmed, and attendance is not Present.
- **Applied:** an application record exists, and its current status is displayed.

A confirmed application may appear in both Applied and Registered. This is intentional because the sections represent different aspects of the student's activity.

A student must not appear as having attended an event merely because their registration is confirmed or their application was accepted.

### 6.8 Attendance Count

Display the student's total attended-event count on the profile.

Calculate it from attendance records marked Present. Do not calculate it from registrations, applications, or the number of cards displayed in other tabs.

The count must update when an administrator changes an attendance record.

## 7. Digital Registration Pass

Each confirmed registration must have a unique registration ID.

Students can view this ID from the relevant event card or registration details page.

The pass is a simple digital representation of the registration. QR scanning, downloadable passes, and PDF generation are not required.

## 8. Attendance Management

Administrators can view the participant list for an event and mark each confirmed participant as Present or Absent.

Requirements:
- Attendance must be linked to the relevant event and student registration.
- Prevent duplicate attendance records for the same registration.
- Allow administrators to correct an attendance record.
- Update the student's Attended section and total attendance count when attendance changes.
- Only students marked Present can submit event feedback.

## 9. Feedback and Ratings

Students can submit feedback after their attendance has been marked Present.

Feedback includes:
- A rating from 1 to 5 stars
- A written comment or response to a feedback question

Requirements:
- Only eligible attendees can submit feedback.
- Each student can submit feedback once per event.
- Administrators can view feedback comments, average ratings, and feedback counts.
- Feedback may be displayed on the relevant event details page.

## 10. Profile Picture Upload

Students can upload or change their profile picture.

Requirements:
- Validate the file type and file size on the server.
- Store the image using the chosen upload approach.
- Store the image reference in the student record.
- Handle invalid files and upload failures with clear error messages.

Event poster uploads are not part of the current scope.

## 11. Technology Stack

### Frontend
- React
- React Router
- CSS or CSS Modules
- Fetch API for HTTP requests

### Backend
- Node.js
- Express.js
- REST API returning JSON
- JWT authentication
- bcrypt or bcryptjs for password hashing
- Multer for profile picture uploads

### Database
- MongoDB
- Mongoose

Use a small number of additional libraries. If a new library is needed, explain why it is necessary before adding it.

## 12. Error Handling and Validation

The frontend and backend must both handle errors properly.

Examples:
- Invalid login credentials
- Duplicate student ID or email
- Invalid college email domain
- Weak password or mismatched confirmation
- Missing required form answers
- Registration after the deadline
- Event capacity reached
- Unauthorized admin actions
- Invalid or missing event data
- Failed profile picture upload
- Duplicate registration or feedback submission
- Failed database operations

Show clear, beginner-friendly error messages. Do not expose passwords, tokens, secrets, or sensitive server details in error responses.

Backend validation is required even when the frontend already validates the same information.

## 13. Security Requirements

- Hash passwords before storing them.
- Keep secrets in environment variables.
- Do not commit `.env` files.
- Use `.env.example` to document required environment variables without real secrets.
- Validate and sanitize incoming data where appropriate.
- Enforce roles and permissions on the backend.
- Do not allow students to access another student's private data without permission.
- Do not trust attendance, registration status, or role changes sent directly by the client.
- Enforce unique student IDs, emails, registrations, and feedback where applicable.
- Check capacity and registration eligibility on the backend.
- Validate uploaded profile pictures.
- Use suitable security middleware and configure CORS for the application.

## 14. Project Boundaries

The project must stay manageable for a student learning the MERN stack.

Do not add the following unless explicitly requested later:
- Payment processing
- QR scanning
- Event image or poster uploads
- Live chat
- AI event recommendations
- Push notifications
- External APIs
- Complex analytics
- Advanced form-builder features
- A full social media feed or social networking system

The Instagram-inspired profile is limited to three separate event-category tabs and shared event cards. It does not require posts, likes, comments, reposts, reels, or other Instagram features.

## 15. Acceptance Criteria

The project can be considered functionally complete when:
- Public visitors can browse events without accessing private student features.
- Students can sign up and log in securely.
- The backend enforces role-based access.
- Administrators can manage events and registration forms.
- Students can register or apply according to an event's registration type.
- Administrators can review applications and manage attendance.
- Student profiles display separate Attended, Registered, and Applied tabs.
- Each tab displays only the event cards appropriate to its purpose.
- All three tabs reuse the same event-card design as the main Events page.
- Application statuses remain visible in Applied, including after an application decision.
- Confirmed applications can appear in both Applied and Registered.
- Attendance marked Present moves an event into Attended.
- The attendance count matches records marked Present.
- Students marked Present can submit feedback once per event.
- Administrators can view feedback and rating summaries.
- Errors and invalid inputs are handled clearly.
- The application works on desktop and mobile screen sizes.

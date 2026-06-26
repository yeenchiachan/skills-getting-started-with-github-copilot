from src.app import activities


def test_root_redirects_to_static_index(client):
    response = client.get("/", follow_redirects=False)

    assert response.status_code in (302, 307)
    assert response.headers["location"] == "/static/index.html"


def test_get_activities_returns_expected_shape(client):
    response = client.get("/activities")

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, dict)
    assert "Pokemon Club" in data

    for details in data.values():
        assert "description" in details
        assert "schedule" in details
        assert "max_participants" in details
        assert "participants" in details
        assert isinstance(details["participants"], list)


def test_signup_success(client):
    email = "brock@mergington.edu"
    activity_name = "Pokemon Club"

    response = client.post(f"/activities/{activity_name}/signup", params={"email": email})

    assert response.status_code == 200
    assert response.json()["message"] == f"Signed up {email} for {activity_name}"
    assert email in activities[activity_name]["participants"]


def test_signup_activity_not_found(client):
    response = client.post("/activities/Unknown Club/signup", params={"email": "new@mergington.edu"})

    assert response.status_code == 404
    assert response.json()["detail"] == "Activity not found"


def test_signup_duplicate_email(client):
    existing_email = "michael@mergington.edu"

    response = client.post("/activities/Chess Club/signup", params={"email": existing_email})

    assert response.status_code == 400
    assert response.json()["detail"] == "Student already signed up for this activity"


def test_unregister_success(client):
    email = "misty@mergington.edu"
    activity_name = "Pokemon Club"

    response = client.delete(f"/activities/{activity_name}/participants", params={"email": email})

    assert response.status_code == 200
    assert response.json()["message"] == f"Unregistered {email} from {activity_name}"
    assert email not in activities[activity_name]["participants"]


def test_unregister_activity_not_found(client):
    response = client.delete("/activities/Unknown Club/participants", params={"email": "new@mergington.edu"})

    assert response.status_code == 404
    assert response.json()["detail"] == "Activity not found"


def test_unregister_student_not_found(client):
    response = client.delete("/activities/Chess Club/participants", params={"email": "nobody@mergington.edu"})

    assert response.status_code == 404
    assert response.json()["detail"] == "Student is not signed up for this activity"


def test_signup_and_unregister_flow(client):
    email = "gary@mergington.edu"
    activity_name = "Pokemon Club"

    signup_response = client.post(f"/activities/{activity_name}/signup", params={"email": email})
    assert signup_response.status_code == 200
    assert email in activities[activity_name]["participants"]

    unregister_response = client.delete(
        f"/activities/{activity_name}/participants",
        params={"email": email},
    )
    assert unregister_response.status_code == 200
    assert email not in activities[activity_name]["participants"]

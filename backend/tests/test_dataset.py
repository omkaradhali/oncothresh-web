"""Tests for the CSV parsing endpoint and its error handling."""

CSV_OK = b"y_true,y_pred,site\n0.05,0.10,A\n0.25,0.30,B\n0.60,0.55,A\n"
CSV_NAN = b"y_true,y_pred\n0.05,0.10\n0.25,notanumber\n"
CSV_MISSING_COL = b"truth,pred\n0.1,0.2\n0.3,0.4\n"


def _upload(client, raw: bytes, **form):
    return client.post(
        "/parse-csv",
        files={"file": ("data.csv", raw, "text/csv")},
        data=form,
    )


def test_parse_csv_ok(client):
    body = _upload(client, CSV_OK, y_true_col="y_true", y_pred_col="y_pred", group_col="site")
    assert body.status_code == 200
    data = body.json()["data"]
    assert data["n_rows"] == 3
    assert data["y_true"] == [0.05, 0.25, 0.60]
    assert data["group"] == ["A", "B", "A"]
    assert set(data["columns"]) == {"y_true", "y_pred", "site"}


def test_parse_csv_without_group(client):
    body = _upload(client, CSV_OK, y_true_col="y_true", y_pred_col="y_pred")
    assert body.status_code == 200
    assert body.json()["data"]["group"] is None


def test_parse_csv_missing_column_is_422(client):
    body = _upload(client, CSV_MISSING_COL, y_true_col="y_true", y_pred_col="y_pred")
    assert body.status_code == 422
    assert "not found" in body.json()["detail"]


def test_parse_csv_non_numeric_is_422(client):
    body = _upload(client, CSV_NAN, y_true_col="y_true", y_pred_col="y_pred")
    assert body.status_code == 422
    assert "line 3" in body.json()["detail"]  # header is line 1, bad cell on data line 3

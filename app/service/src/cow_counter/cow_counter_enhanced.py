from inference_sdk import InferenceHTTPClient
from inference_sdk.http.entities import InferenceConfiguration

from ..config import API_KEY_INFERENCE_SDK

# initialize the client
CLIENT = InferenceHTTPClient(
    api_url="https://serverless.roboflow.com",
    api_key=API_KEY_INFERENCE_SDK
)


def analyze_image_and_count_cows(image_path: str):
    """
    Analyze the image and count cows using the enhanced methodology.
    Uses Roboflow's inference API to detect cows in the image.
    """

    # Configure client with 0% confidence threshold
    config = InferenceConfiguration(confidence_threshold=0)

    with CLIENT.use_configuration(config):
        result = CLIENT.run_workflow(
            workspace_name="testing-mel1t",
            workflow_id="detect-count-and-visualize",
            images={"image": image_path},
            use_cache=True  # cache workflow definition for 15 minutes
        )

    # Extract predictions from the response
    predictions = result[0]["predictions"].get("predictions", [])

    # Count the number of cow detections
    cow_count = len(predictions)

    # Convert predictions to the expected detection format
    detections = []
    for pred in predictions:
        detection = {
            "confidence": pred["confidence"],
            "bbox": [
                pred["x"] - pred["width"] / 2,  # x1 (left)
                pred["y"] - pred["height"] / 2,  # y1 (top)
                pred["x"] + pred["width"] / 2,  # x2 (right)
                pred["y"] + pred["height"] / 2   # y2 (bottom)
            ],
            "class_name": pred.get("class", "cow"),
            "class_id": pred.get("class_id", 0),
            "model": "roboflow",
            "size": pred.get("width", 0) * pred.get("height", 0)  # Area as size
        }
        detections.append(detection)

    return cow_count, detections

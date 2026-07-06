"""The eight evaluation endpoints, one per oncothresh public method.

Each endpoint is deliberately thin: build an evaluator from the request arrays, call the
matching library method (mapping any ValueError to 422), and return the library's own
result model inside the version-stamped envelope. No statistics are computed here.
"""

from fastapi import APIRouter, Depends

from app import dataset
from app.dependencies import response_meta
from app.schemas import (
    ApiResponse,
    BootstrapCIRequest,
    BoundaryCalibrationRequest,
    CompareModelsRequest,
    DecisionCurveRequest,
    EvaluateRequest,
    MultiThresholdRequest,
    NNTRequest,
    ResponseMeta,
    ThresholdSensitivityRequest,
)
from oncothresh import compare_models
from oncothresh._results import (
    BootstrapResult,
    BoundaryCalibrationResult,
    CompareModelsResult,
    DecisionCurveResult,
    MultiThresholdReport,
    NNTResult,
    ThresholdResult,
    ThresholdSensitivityResult,
)

router = APIRouter(tags=["evaluation"])


@router.post("/evaluate", response_model=ApiResponse[ThresholdResult])
def evaluate(req: EvaluateRequest, meta: ResponseMeta = Depends(response_meta)):
    """Classification metrics at a single clinical threshold."""
    ev = dataset.build_evaluator(req.y_true, req.y_pred)
    result = dataset.run(ev.evaluate, threshold=req.threshold)
    return ApiResponse(meta=meta, data=result)


@router.post("/bootstrap-ci", response_model=ApiResponse[BootstrapResult])
def bootstrap_ci(req: BootstrapCIRequest, meta: ResponseMeta = Depends(response_meta)):
    """Bootstrap confidence intervals for every metric."""
    ev = dataset.build_evaluator(req.y_true, req.y_pred)
    result = dataset.run(
        ev.bootstrap_ci,
        threshold=req.threshold,
        n_bootstrap=req.n_bootstrap,
        confidence=req.confidence,
        random_state=req.random_state,
        method=req.method,
    )
    return ApiResponse(meta=meta, data=result)


@router.post("/multi-threshold-report", response_model=ApiResponse[MultiThresholdReport])
def multi_threshold_report(req: MultiThresholdRequest, meta: ResponseMeta = Depends(response_meta)):
    """Metrics side-by-side across several clinical thresholds."""
    ev = dataset.build_evaluator(req.y_true, req.y_pred)
    result = dataset.run(ev.multi_threshold_report, thresholds=req.thresholds)
    return ApiResponse(meta=meta, data=result)


@router.post("/nnt", response_model=ApiResponse[NNTResult])
def nnt(req: NNTRequest, meta: ResponseMeta = Depends(response_meta)):
    """Number needed to treat at a clinical threshold."""
    ev = dataset.build_evaluator(req.y_true, req.y_pred)
    result = dataset.run(ev.nnt, threshold=req.threshold)
    return ApiResponse(meta=meta, data=result)


@router.post("/threshold-sensitivity", response_model=ApiResponse[ThresholdSensitivityResult])
def threshold_sensitivity(req: ThresholdSensitivityRequest, meta: ResponseMeta = Depends(response_meta)):
    """How sensitivity/specificity move as the threshold shifts."""
    ev = dataset.build_evaluator(req.y_true, req.y_pred)
    result = dataset.run(
        ev.threshold_sensitivity,
        threshold=req.threshold,
        delta=req.delta,
        step=req.step,
    )
    return ApiResponse(meta=meta, data=result)


@router.post("/boundary-calibration", response_model=ApiResponse[BoundaryCalibrationResult])
def boundary_calibration(req: BoundaryCalibrationRequest, meta: ResponseMeta = Depends(response_meta)):
    """Boundary-weighted calibration error near the threshold."""
    ev = dataset.build_evaluator(req.y_true, req.y_pred)
    result = dataset.run(
        ev.boundary_calibration,
        threshold=req.threshold,
        window=req.window,
        n_bins=req.n_bins,
    )
    return ApiResponse(meta=meta, data=result)


@router.post("/decision-curve", response_model=ApiResponse[DecisionCurveResult])
def decision_curve(req: DecisionCurveRequest, meta: ResponseMeta = Depends(response_meta)):
    """Decision Curve Analysis (net benefit) for a fixed clinical decision."""
    ev = dataset.build_evaluator(req.y_true, req.y_pred)
    result = dataset.run(
        ev.decision_curve,
        clinical_threshold=req.clinical_threshold,
        thresholds=req.thresholds,
    )
    return ApiResponse(meta=meta, data=result)


@router.post("/compare-models", response_model=ApiResponse[CompareModelsResult])
def compare(req: CompareModelsRequest, meta: ResponseMeta = Depends(response_meta)):
    """Compare several models on the same test set at one threshold."""
    evaluators = [dataset.build_evaluator(req.y_true, m.y_pred) for m in req.models]
    names = [m.name for m in req.models]
    # The library either takes a full list of names or auto-generates them all. Only pass
    # names if every model was named; a partial set falls back to the library's defaults.
    model_names = names if all(n is not None for n in names) else None
    result = dataset.run(
        compare_models,
        evaluators=evaluators,
        threshold=req.threshold,
        model_names=model_names,
    )
    return ApiResponse(meta=meta, data=result)

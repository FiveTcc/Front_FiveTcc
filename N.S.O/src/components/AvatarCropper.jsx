import { useCallback, useState } from "react";
import Cropper from "react-easy-crop";

export default function AvatarCropper({
  isOpen,
  imageSrc,
  onClose,
  onSave,
  title = "Ajustar foto de perfil",
  saveLabel = "Salvar foto",
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [salvando, setSalvando] = useState(false);

  const onCropComplete = useCallback((_, pixels) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const getCroppedImageUrl = useCallback(async () => {
    if (!imageSrc || !croppedAreaPixels) {
      return null;
    }

    return new Promise((resolve, reject) => {
      const image = new Image();
      image.src = imageSrc;
      image.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        const outputSize = 512;
        canvas.width = outputSize;
        canvas.height = outputSize;

        const safeArea = {
          x: Math.max(0, croppedAreaPixels.x),
          y: Math.max(0, croppedAreaPixels.y),
          width: Math.max(0, croppedAreaPixels.width),
          height: Math.max(0, croppedAreaPixels.height),
        };

        if (!ctx) {
          reject(new Error("Canvas não disponível."));
          return;
        }

        ctx.clearRect(0, 0, outputSize, outputSize);

        const radians = (rotation * Math.PI) / 180;
        ctx.translate(outputSize / 2, outputSize / 2);
        ctx.rotate(radians);
        ctx.translate(-outputSize / 2, -outputSize / 2);

        ctx.drawImage(
          image,
          safeArea.x,
          safeArea.y,
          safeArea.width,
          safeArea.height,
          0,
          0,
          outputSize,
          outputSize,
        );

        const result = canvas.toDataURL("image/jpeg", 0.92);
        resolve(result);
      };

      image.onerror = () => {
        reject(new Error("Não foi possível processar a imagem."));
      };
    });
  }, [croppedAreaPixels, imageSrc, rotation]);

  const handleSave = useCallback(async () => {
    if (!imageSrc || !croppedAreaPixels) {
      return;
    }

    try {
      setSalvando(true);
      const finalImage = await getCroppedImageUrl();
      if (finalImage) {
        onSave(finalImage);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSalvando(false);
    }
  }, [croppedAreaPixels, getCroppedImageUrl, imageSrc, onSave]);

  const resetCrop = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setCroppedAreaPixels(null);
  };

  if (!isOpen || !imageSrc) {
    return null;
  }

  return (
    <div className="recorte-modal" role="dialog" aria-modal="true">
      <div className="recorte-modal__fundo" onClick={onClose} />
      <div className="recorte-modal__painel">
        <div className="recorte-modal__cabecalho">
          <h4>{title}</h4>
          <button
            type="button"
            className="recorte-modal__fechar"
            onClick={() => {
              resetCrop();
              onClose();
            }}
          >
            ×
          </button>
        </div>

        <div className="recorte-modal__recorte-area">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            onCropComplete={onCropComplete}
          />
        </div>

        <div className="recorte-modal__controles">
          <label>
            <span>Zoom</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(event) => setZoom(Number(event.target.value))}
            />
          </label>

          <label>
            <span>Girar</span>
            <input
              type="range"
              min={0}
              max={360}
              step={1}
              value={rotation}
              onChange={(event) => setRotation(Number(event.target.value))}
            />
          </label>
        </div>

        <div className="recorte-modal__acoes">
          <button
            type="button"
            className="botao botao--transparente"
            onClick={() => {
              resetCrop();
              onClose();
            }}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="botao botao--principal"
            onClick={handleSave}
            disabled={salvando}
          >
            {salvando ? "Salvando..." : saveLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

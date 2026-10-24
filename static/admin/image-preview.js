(() => {
  function attach(root) {
    root.querySelectorAll('input[type="file"][name$="archivo"]').forEach(input => {
      if (input.dataset.previewReady) return;
      input.dataset.previewReady = 'true';
      input.accept = 'image/jpeg,image/png,image/webp';
      const image = document.createElement('img');
      image.alt = 'Vista previa del archivo seleccionado';
      image.style.cssText = 'display:none;max-width:200px;max-height:150px;object-fit:contain;margin-top:12px;border-radius:8px';
      input.parentElement.append(image);
      let previous;
      input.addEventListener('change', () => {
        if (previous) URL.revokeObjectURL(previous);
        const file = input.files[0];
        image.style.display = file ? 'block' : 'none';
        if (file) image.src = previous = URL.createObjectURL(file);
        else image.removeAttribute('src');
      });
    });
  }
  document.addEventListener('DOMContentLoaded', () => attach(document));
  document.addEventListener('formset:added', event => attach(event.target));
})();

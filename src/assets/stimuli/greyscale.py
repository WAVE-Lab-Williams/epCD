import glob 
from PIL import Image 


for name in glob.glob('cabinets/typeSide/*.png'):
    img = Image.open(name).convert('L')
    img.save(name)
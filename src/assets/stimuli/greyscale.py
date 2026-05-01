import glob 
from PIL import Image 

for name in glob.glob('cabinets/*.png'):
    print(name)
    img = Image.open(name).convert('L')
    img.save(name)
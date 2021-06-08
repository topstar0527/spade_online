from PIL import Image

# image_path: image's file path
# coordinates: (x1, y1, x2, y2), location coordinates to crop
# save_loc: saving location
# reshape_dim: reshapes the cropped image to a new dimension
def crop(image_path, coordinates, save_loc, reshape_dim = None):
    image = Image.open(image_path)
    cropped_image = image.crop(coordinates)
    if reshape_dim:
        cropped_image = cropped_image.resize(reshape_dim)
    cropped_image.save(save_loc)

if __name__ == '__main__':
    image_path = 'all_cards.png'
    # there are 13 cards in each row and 5 rows (last row contains 3 cards, only the third is useful)
    # image is from https://pixabay.com/en/card-deck-deck-cards-playing-cards-161536/
    image = Image.open(image_path)
    image_width = image.size[0]
    image_height = image.size[1]
    num_rows = 5
    num_cols = 13
    card_width = image_width/num_cols
    card_height = image_height/num_rows

    save_folder = '../images/'
    ext = '.jpg'
    row_to_suit = {0:'club', 1:'diamond', 2:'heart', 3:'spade'}

    # get each playing card face
    for y in range(num_rows - 1):
        for x in range(num_cols):
            crop_loc = (card_width * x, card_height * y, card_width * (x + 1), card_height * (y + 1))
            # Ace is 1, and the number increments by 1 up to 13, which is the King's value
            card_name = str(row_to_suit[y]) + '_' + str(x + 1) 
            crop(image_path, crop_loc, save_folder + card_name + ext)

    # get card back (3rd card on 5th row)
    card_back_loc = (card_width * 2, card_height * 4, card_width * 3, card_height * 5)
    crop(image_path, card_back_loc, save_folder + 'card_back' + ext)
